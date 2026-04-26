import { Hono } from "hono";
import { cors } from "hono/cors";
import { eq, and, sql, count, desc, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export interface Env {
  DB: D1Database;
  CARD_IMAGES: R2Bucket;
  CLOUDWAPI_KEY?: string;
  CLOUDWAPI_SENDER?: string;
  ADMIN_WHATSAPP?: string;
  WEBHOOK_TOKEN?: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS - allow all origins for the static site
app.use("*", cors({
  origin: ["https://jamestyle.com", "https://www.jamestyle.com", "https://159f699d.jamestyle.pages.dev", "http://localhost:5173"],
  allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Reset-Token"],
  credentials: true,
}));

// Health check
app.get("/", (c) => c.json({ ok: true, service: "jamestyle-analytics" }));

// ============================================================
// REACTIONS API
// ============================================================
app.get("/api/public/reactions", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const results = await db
    .select({
      slideId: schema.reactions.slideId,
      reactionType: schema.reactions.reactionType,
      count: count(),
    })
    .from(schema.reactions)
    .groupBy(schema.reactions.slideId, schema.reactions.reactionType);
  return c.json({ data: results });
});

app.post("/api/public/reactions", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const data = await c.req.json();
  await db.insert(schema.reactions).values({
    slideId: data.slideId,
    reactionType: data.reactionType,
    sessionId: data.sessionId ?? null,
  });
  return c.json({ success: true });
});

// ============================================================
// SESSIONS API
// ============================================================
app.post("/api/public/sessions", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const data = await c.req.json();
  const sessionId = data.id ?? data.sessionId;
  const existing = await db
    .select()
    .from(schema.visitorSessions)
    .where(eq(schema.visitorSessions.id, sessionId))
    .get();

  if (existing) {
    await db
      .update(schema.visitorSessions)
      .set({ lastActive: Math.floor(Date.now() / 1000) })
      .where(eq(schema.visitorSessions.id, sessionId));
    return c.json({ data: { id: sessionId, updated: true } });
  }

  await db.insert(schema.visitorSessions).values({
    id: sessionId,
    fingerprint: data.fingerprint ?? null,
    userAgent: data.userAgent ?? null,
    referrer: data.referrer ?? null,
    deviceType: data.deviceType ?? "unknown",
    screenWidth: data.screenWidth ?? null,
    screenHeight: data.screenHeight ?? null,
    language: data.language ?? null,
  });
  return c.json({ data: { id: sessionId, created: true } });
});

app.patch("/api/public/sessions/:id", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const id = c.req.param("id");
  const data = await c.req.json();

  const update: any = { lastActive: Math.floor(Date.now() / 1000) };
  if (data.totalSlidesViewed !== undefined) update.totalSlidesViewed = data.totalSlidesViewed;
  if (data.maxSlideReached !== undefined) update.maxSlideReached = data.maxSlideReached;
  if (data.completedGallery !== undefined) update.completedGallery = data.completedGallery;

  await db.update(schema.visitorSessions).set(update).where(eq(schema.visitorSessions.id, id));
  return c.json({ success: true });
});

// ============================================================
// EVENTS API
// ============================================================
app.post("/api/public/events", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const data = await c.req.json();
  await db.insert(schema.visitorEvents).values({
    sessionId: data.sessionId,
    eventType: data.eventType,
    slideId: data.slideId ?? null,
    eventData: data.eventData ? JSON.stringify(data.eventData) : null,
    durationMs: data.durationMs ?? null,
  });
  return c.json({ success: true });
});

app.post("/api/public/events/batch", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const body = await c.req.json();
  const items = body.events ?? body;
  if (Array.isArray(items) && items.length > 0) {
    const values = items.map((d: any) => ({
      sessionId: d.sessionId,
      eventType: d.eventType,
      slideId: d.slideId ?? null,
      eventData: d.eventData ? JSON.stringify(d.eventData) : null,
      durationMs: d.durationMs ?? null,
    }));
    await db.insert(schema.visitorEvents).values(values);
  }
  return c.json({ success: true, batchSize: items.length });
});

// ============================================================
// ANALYTICS DASHBOARD API
// ============================================================
app.get("/api/public/analytics/summary", async (c) => {
  const db = drizzle(c.env.DB, { schema });

  const [sessionsResult, reactionsResult, eventsResult, completedResult] = await Promise.all([
    db.select({ total: count() }).from(schema.visitorSessions).get(),
    db.select({ total: count() }).from(schema.reactions).get(),
    db.select({ total: count() }).from(schema.visitorEvents).get(),
    db.select({ total: count() }).from(schema.visitorSessions).where(eq(schema.visitorSessions.completedGallery, 1)).get(),
  ]);

  const totalSessions = sessionsResult?.total ?? 0;
  const totalReactions = reactionsResult?.total ?? 0;
  const totalEvents = eventsResult?.total ?? 0;

  const deviceResult = await db
    .select({ deviceType: schema.visitorSessions.deviceType, count: count() })
    .from(schema.visitorSessions)
    .groupBy(schema.visitorSessions.deviceType);

  const topSlides = await db
    .select({ slideId: schema.visitorEvents.slideId, count: count() })
    .from(schema.visitorEvents)
    .where(eq(schema.visitorEvents.eventType, "slide_view"))
    .groupBy(schema.visitorEvents.slideId)
    .orderBy(desc(count()))
    .limit(5);

  // Average max slide reached
  const avgMaxSlideResult = await db
    .select({ avgMax: sql<number>`COALESCE(AVG(${schema.visitorSessions.maxSlideReached}), 0)` })
    .from(schema.visitorSessions)
    .get();

  // Reaction type distribution
  const reactionDistribution = await db
    .select({ reactionType: schema.reactions.reactionType, count: count() })
    .from(schema.reactions)
    .groupBy(schema.reactions.reactionType);

  return c.json({
    data: {
      totalSessions,
      totalReactions,
      totalEvents,
      completedGallery: completedResult?.total ?? 0,
      completionRate: totalSessions > 0 ? ((completedResult?.total ?? 0) / totalSessions * 100).toFixed(1) : "0.0",
      avgMaxSlide: Number((avgMaxSlideResult?.avgMax ?? 0).toFixed(1)),
      deviceDistribution: deviceResult,
      topSlides,
      reactionDistribution,
    },
  });
});

app.get("/api/public/analytics/slide-heatmap", async (c) => {
  const db = drizzle(c.env.DB, { schema });

  const heatmapRaw = await db
    .select({
      slideId: schema.visitorEvents.slideId,
      views: count(),
      avgDuration: sql<number>`COALESCE(AVG(${schema.visitorEvents.durationMs}), 0)`,
    })
    .from(schema.visitorEvents)
    .where(eq(schema.visitorEvents.eventType, "slide_view"))
    .groupBy(schema.visitorEvents.slideId);

  const reactionsBySlide = await db
    .select({
      slideId: schema.reactions.slideId,
      reactionType: schema.reactions.reactionType,
      count: count(),
    })
    .from(schema.reactions)
    .groupBy(schema.reactions.slideId, schema.reactions.reactionType);

  // Insight views (eventType = "insight_open")
  const insightViews = await db
    .select({
      slideId: schema.visitorEvents.slideId,
      count: count(),
    })
    .from(schema.visitorEvents)
    .where(eq(schema.visitorEvents.eventType, "insight_open"))
    .groupBy(schema.visitorEvents.slideId);

  // Map to frontend expected structure
  const viewCounts = heatmapRaw.map((h) => ({ slideId: h.slideId, count: h.views }));
  const dwellTimes = heatmapRaw.map((h) => ({ slideId: h.slideId, avgDwell: Math.round(h.avgDuration) }));

  return c.json({
    data: {
      viewCounts,
      dwellTimes,
      insightViews,
      reactionsBySlide,
    },
  });
});

app.get("/api/public/analytics/fan-scores", async (c) => {
  const db = drizzle(c.env.DB, { schema });

  const sessions = await db
    .select()
    .from(schema.visitorSessions)
    .orderBy(desc(schema.visitorSessions.totalSlidesViewed))
    .limit(20);

  const getTier = (score: number) => {
    if (score >= 80) return { key: 'superfan', label: '鐵粉' };
    if (score >= 60) return { key: 'loyal', label: '忠實粉絲' };
    if (score >= 40) return { key: 'active', label: '活躍觀眾' };
    if (score >= 20) return { key: 'regular', label: '普通觀眾' };
    return { key: 'passerby', label: '路人' };
  };

  const fans = sessions.map((s) => {
    const score = (s.totalSlidesViewed ?? 0) * 10 + (s.completedGallery ? 50 : 0);
    const tier = getTier(score);
    return {
      sessionId: s.id,
      deviceType: s.deviceType,
      slidesViewed: s.totalSlidesViewed,
      maxSlideReached: s.maxSlideReached,
      reactions: 0,
      completedGallery: s.completedGallery,
      score,
      tier: tier.key,
      tierKey: tier.key,
    };
  });

  const totalFans = fans.length;
  const avgScore = totalFans > 0
    ? Math.round(fans.reduce((sum, f) => sum + f.score, 0) / totalFans)
    : 0;

  // Tier distribution
  const tiers: Record<string, number> = {};
  fans.forEach((f) => {
    tiers[f.tierKey] = (tiers[f.tierKey] || 0) + 1;
  });

  return c.json({
    data: {
      totalFans,
      avgScore,
      tierDistribution: tiers,
      fans,
    },
  });
});

app.get("/api/public/analytics/timeline", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const days = parseInt(c.req.query("days") ?? "30");
  const since = Math.floor(Date.now() / 1000) - days * 86400;

  const sessionsTimeline = await db
    .select({
      date: sql<string>`date(${schema.visitorSessions.sessionStart}, 'unixepoch')`,
      count: count(),
    })
    .from(schema.visitorSessions)
    .where(gte(schema.visitorSessions.sessionStart, since))
    .groupBy(sql`date(${schema.visitorSessions.sessionStart}, 'unixepoch')`);

  const reactionsTimeline = await db
    .select({
      date: sql<string>`date(${schema.reactions.createdAt}, 'unixepoch')`,
      count: count(),
    })
    .from(schema.reactions)
    .where(gte(schema.reactions.createdAt, since))
    .groupBy(sql`date(${schema.reactions.createdAt}, 'unixepoch')`);

  // Map to frontend expected field names
  const sessionsPerDay = sessionsTimeline.map((d) => ({ day: d.date, count: d.count }));
  const reactionsPerDay = reactionsTimeline.map((d) => ({ day: d.date, count: d.count }));

  return c.json({ data: { sessionsPerDay, reactionsPerDay } });
});

// ============================================================
// OPENING FUNNEL ANALYTICS
// ============================================================
app.get("/api/public/analytics/opening-funnel", async (c) => {
  const db = drizzle(c.env.DB, { schema });

  // Get counts for each opening event type
  const eventCounts = await db
    .select({
      eventType: schema.visitorEvents.eventType,
      count: count(),
    })
    .from(schema.visitorEvents)
    .where(sql`${schema.visitorEvents.eventType} LIKE 'opening_%' OR ${schema.visitorEvents.eventType} LIKE 'bubble_%' OR ${schema.visitorEvents.eventType} LIKE 'digest_%' OR ${schema.visitorEvents.eventType} LIKE 'slideshow_%'`)
    .groupBy(schema.visitorEvents.eventType);

  // Bubble pop breakdown
  const bubblePops = await db
    .select({
      eventData: schema.visitorEvents.eventData,
    })
    .from(schema.visitorEvents)
    .where(eq(schema.visitorEvents.eventType, "bubble_popped"));

  const bubbleStats: Record<string, { manual: number; auto: number }> = {};
  bubblePops.forEach((b) => {
    try {
      const data = JSON.parse(b.eventData || '{}');
      const label = data.label || 'unknown';
      if (!bubbleStats[label]) bubbleStats[label] = { manual: 0, auto: 0 };
      if (data.isAuto) bubbleStats[label].auto++;
      else bubbleStats[label].manual++;
    } catch {}
  });

  return c.json({
    data: {
      eventCounts: Object.fromEntries(eventCounts.map((e) => [e.eventType, e.count])),
      bubbleStats,
    },
  });
});

// ============================================================
// MOBILE METRICS API
// ============================================================
app.post("/api/public/device-metrics", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const data = await c.req.json();
  await db.insert(schema.deviceMetrics).values({
    sessionId: data.sessionId,
    deviceType: data.deviceType,
    screenWidth: data.screenWidth ?? null,
    screenHeight: data.screenHeight ?? null,
    devicePixelRatio: data.devicePixelRatio ?? null,
    orientation: data.orientation ?? null,
    os: data.os ?? null,
    browser: data.browser ?? null,
    fcpMs: data.fcpMs ?? null,
    connectionType: data.connectionType ?? null,
    language: data.language ?? null,
    timezone: data.timezone ?? null,
    memoryGb: data.memoryGb ?? null,
    touchLatencyMs: data.touchLatencyMs ?? null,
    maxTouchPoints: data.maxTouchPoints ?? null,
  });
  return c.json({ success: true });
});

app.get("/api/public/analytics/device", async (c) => {
  try {
    const db = drizzle(c.env.DB, { schema });

    const total = await db.select({ count: count() }).from(schema.deviceMetrics).get();

    const orientationDist = await db
      .select({ orientation: schema.deviceMetrics.orientation, count: count() })
      .from(schema.deviceMetrics)
      .groupBy(schema.deviceMetrics.orientation);

    const connectionDist = await db
      .select({ connectionType: schema.deviceMetrics.connectionType, count: count() })
      .from(schema.deviceMetrics)
      .groupBy(schema.deviceMetrics.connectionType);

    const osDist = await db
      .select({ os: schema.deviceMetrics.os, count: count() })
      .from(schema.deviceMetrics)
      .groupBy(schema.deviceMetrics.os);

    const browserDist = await db
      .select({ browser: schema.deviceMetrics.browser, count: count() })
      .from(schema.deviceMetrics)
      .groupBy(schema.deviceMetrics.browser);

    const fcpAvg = await db
      .select({ avg: sql<number>`COALESCE(AVG(${schema.deviceMetrics.fcpMs}), 0)` })
      .from(schema.deviceMetrics)
      .get();

    const screenSizes = await db
      .select({
        range: sql<string>`CASE
          WHEN ${schema.deviceMetrics.screenWidth} < 400 THEN '< 400px'
          WHEN ${schema.deviceMetrics.screenWidth} < 768 THEN '400-767px'
          WHEN ${schema.deviceMetrics.screenWidth} < 1024 THEN '768-1023px'
          ELSE '>= 1024px'
        END`,
        count: count(),
      })
      .from(schema.deviceMetrics)
      .groupBy(sql`CASE
        WHEN ${schema.deviceMetrics.screenWidth} < 400 THEN '< 400px'
        WHEN ${schema.deviceMetrics.screenWidth} < 768 THEN '400-767px'
        WHEN ${schema.deviceMetrics.screenWidth} < 1024 THEN '768-1023px'
        ELSE '>= 1024px'
      END`);

    return c.json({
      data: {
        total: total?.count ?? 0,
        orientationDist,
        connectionDist,
        osDist,
        browserDist,
        fcpAvg: fcpAvg?.avg ?? 0,
        screenSizes,
      },
    });
  } catch (err: any) {
    console.error("Mobile analytics error:", err);
    return c.json({ error: err.message || "Unknown error" }, 500);
  }
});

// ============================================================
// EDGESPARK AUTH COMPATIBILITY (dead code shim)
// ============================================================
app.get("/api/_es/config", (c) => {
  return c.json({
    disableSignUp: true,
    enableAnonymous: false,
    providerEmailPassword: { enabled: false, config: {} },
    providerGoogle: { enabled: false, config: {} },
  });
});

app.all("/api/_es/auth/*", (c) => {
  return c.json({ error: "Auth disabled" }, 404);
});

// ============================================================
// ENGAGEMENT ANALYTICS (emotions, achievements, sound, collage)
// ============================================================
app.get("/api/public/analytics/engagement", async (c) => {
  const db = drizzle(c.env.DB, { schema });

  // Emotion votes per slide
  const emotionVotes = await db
    .select({
      slideId: schema.visitorEvents.slideId,
      eventData: schema.visitorEvents.eventData,
      count: count(),
    })
    .from(schema.visitorEvents)
    .where(eq(schema.visitorEvents.eventType, "emotion_vote"))
    .groupBy(schema.visitorEvents.slideId, schema.visitorEvents.eventData);

  const emotionSpectrum: Record<number, Record<string, number>> = {};
  emotionVotes.forEach((v) => {
    if (!v.slideId) return;
    try {
      const data = JSON.parse(v.eventData || '{}');
      const emotion = data.emotion || 'unknown';
      if (!emotionSpectrum[v.slideId]) emotionSpectrum[v.slideId] = {};
      emotionSpectrum[v.slideId][emotion] = v.count;
    } catch {}
  });

  // Achievement unlock stats
  const achievementEvents = await db
    .select({
      eventData: schema.visitorEvents.eventData,
      count: count(),
    })
    .from(schema.visitorEvents)
    .where(eq(schema.visitorEvents.eventType, "achievement_unlocked"))
    .groupBy(schema.visitorEvents.eventData);

  const achievementStats: Record<string, number> = {};
  achievementEvents.forEach((a) => {
    try {
      const data = JSON.parse(a.eventData || '{}');
      const id = data.id || data.achievementId || 'unknown';
      achievementStats[id] = a.count;
    } catch {}
  });

  // Sound toggle stats
  const soundEvents = await db
    .select({
      eventData: schema.visitorEvents.eventData,
      count: count(),
    })
    .from(schema.visitorEvents)
    .where(eq(schema.visitorEvents.eventType, "sound_toggle"))
    .groupBy(schema.visitorEvents.eventData);

  let soundOnCount = 0;
  let soundOffCount = 0;
  soundEvents.forEach((s) => {
    try {
      const data = JSON.parse(s.eventData || '{}');
      if (data.enabled === true || data.enabled === 'true') soundOnCount += s.count;
      else soundOffCount += s.count;
    } catch {}
  });

  // Collage share count
  const collageResult = await db
    .select({ count: count() })
    .from(schema.visitorEvents)
    .where(eq(schema.visitorEvents.eventType, "collage_share"))
    .get();

  // Avg achievements per session
  const achievementSessions = await db
    .select({ sessionId: schema.visitorEvents.sessionId, count: count() })
    .from(schema.visitorEvents)
    .where(eq(schema.visitorEvents.eventType, "achievement_unlocked"))
    .groupBy(schema.visitorEvents.sessionId);

  const totalSessionsResult = await db
    .select({ count: count() })
    .from(schema.visitorSessions)
    .get();

  const totalSessions = totalSessionsResult?.count ?? 0;
  const totalAchievements = achievementSessions.reduce((sum, s) => sum + s.count, 0);
  const sessionsWithAchievements = achievementSessions.length;

  return c.json({
    data: {
      emotionSpectrum,
      achievementStats,
      soundToggle: {
        on: soundOnCount,
        off: soundOffCount,
        rate: (soundOnCount + soundOffCount) > 0
          ? ((soundOnCount / (soundOnCount + soundOffCount)) * 100).toFixed(1)
          : "0.0",
      },
      collageCount: collageResult?.count ?? 0,
      achievementSummary: {
        totalAchievements,
        sessionsWithAchievements,
        avgPerSession: sessionsWithAchievements > 0
          ? (totalAchievements / sessionsWithAchievements).toFixed(2)
          : "0.00",
        avgPerAllSessions: totalSessions > 0
          ? (totalAchievements / totalSessions).toFixed(2)
          : "0.00",
      },
    },
  });
});

// ============================================================
// CARD SHARE & WHATSAPP LEAD CAPTURE
// ============================================================

function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
}

function getCardImageUrl(slideId: number, env: Env): string {
  // Try R2 public URL first; fallback to CDN image if not yet uploaded
  return `https://r2.jamestyle.com/cards/slide_${String(slideId).padStart(2, '0')}.png`;
}

app.post("/api/public/card-share/request", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const data = await c.req.json();
  const slideId = data.slideId;
  const sessionId = data.sessionId || null;

  if (!slideId || slideId < 1 || slideId > 15) {
    return c.json({ error: "Invalid slideId" }, 400);
  }

  const shareToken = generateShareToken();
  const now = Math.floor(Date.now() / 1000);

  await db.insert(schema.cardShares).values({
    sessionId,
    slideId,
    shareToken,
    status: "pending",
    createdAt: now,
  });

  // Track event
  await db.insert(schema.visitorEvents).values({
    sessionId: sessionId || "anonymous",
    eventType: "card_share_request",
    slideId,
    eventData: JSON.stringify({ shareToken }),
  });

  const cardUrl = getCardImageUrl(slideId, c.env);
  const adminPhone = c.env.ADMIN_WHATSAPP || "85268810677";
  const todayStr = new Date().toLocaleDateString("zh-HK");

  const message = `我在 JameStyle 發現了這張阿占語錄卡片 🖼️\n${cardUrl}\n\n「${String(slideId).padStart(2, "0")}號作品」\n來自 JameStyle.com`;
  const deepLink = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;

  return c.json({
    success: true,
    shareToken,
    deepLink,
    cardUrl,
    expiresIn: 1800,
  });
});

app.get("/api/public/card-share/status/:token", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const token = c.req.param("token");

  const result = await db
    .select()
    .from(schema.cardShares)
    .where(eq(schema.cardShares.shareToken, token))
    .get();

  if (!result) {
    return c.json({ error: "Token not found" }, 404);
  }

  const now = Math.floor(Date.now() / 1000);
  const isExpired = result.createdAt && (now - result.createdAt) > 1800;

  return c.json({
    status: isExpired ? "expired" : result.status,
    slideId: result.slideId,
    sharedAt: result.sharedAt,
  });
});

// ============================================================
// WHATSAPP WEBHOOK (CloudWapi)
// ============================================================

app.post("/api/webhooks/whatsapp", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const url = new URL(c.req.url);
  const token = url.searchParams.get("token");

  // Verify webhook token if configured
  if (c.env.WEBHOOK_TOKEN && token !== c.env.WEBHOOK_TOKEN) {
    return c.json({ status: "error", error: "Unauthorized" }, 401);
  }

  try {
    const body = await c.req.json();
    const phone = body.phone || body.from;
    const message = body.message || "";
    const sender = body.sender || "user";

    if (!phone || !message) {
      return c.json({ status: "error", error: "Missing phone or message" }, 400);
    }

    const timestamp = body.timestamp || new Date().toISOString();
    const now = Math.floor(Date.now() / 1000);

    // Store/update lead
    const existingLead = await db
      .select()
      .from(schema.whatsappLeads)
      .where(eq(schema.whatsappLeads.phone, phone))
      .get();

    if (existingLead) {
      const history = JSON.parse(existingLead.conversationHistory || "[]");
      history.push({ message, sender, timestamp });
      await db
        .update(schema.whatsappLeads)
        .set({
          shareCount: (existingLead.shareCount || 0) + 1,
          lastShareAt: now,
          conversationHistory: JSON.stringify(history),
        })
        .where(eq(schema.whatsappLeads.phone, phone));
    } else {
      await db.insert(schema.whatsappLeads).values({
        phone,
        firstContactAt: now,
        source: "card_share",
        shareCount: 1,
        lastShareAt: now,
        conversationHistory: JSON.stringify([{ message, sender, timestamp }]),
      });
    }

    // Try to match share token from message to update card_shares status
    const tokenMatch = message.match(/jamestyle\.com.*?(\w{16})/i);
    if (tokenMatch) {
      const matchedToken = tokenMatch[1];
      await db
        .update(schema.cardShares)
        .set({ status: "completed", sharedAt: now })
        .where(eq(schema.cardShares.shareToken, matchedToken));
    }

    // Auto-reply thank you message via CloudWapi (if configured)
    const apiKey = c.env.CLOUDWAPI_KEY;
    const cloudSender = c.env.CLOUDWAPI_SENDER;
    if (apiKey && cloudSender && sender === "user") {
      try {
        const replyMsg = `多謝你分享阿占嘅語錄卡片！🙏\n\n歡迎隨時瀏覽更多作品：\nhttps://jamestyle.com`;
        const pushUrl = new URL("https://unofficial.cloudwapi.in/send-message");
        pushUrl.searchParams.append("api_key", apiKey);
        pushUrl.searchParams.append("sender", cloudSender.replace(/\D/g, ""));
        pushUrl.searchParams.append("number", phone.replace(/\D/g, ""));
        pushUrl.searchParams.append("message", replyMsg);

        await fetch(pushUrl.toString(), { method: "GET" });
      } catch (e) {
        console.error("[CloudWapi] Auto-reply failed:", e);
      }
    }

    return c.json({ status: "success", phone });
  } catch (e: any) {
    console.error("[Webhook] WhatsApp webhook error:", e);
    return c.json({ status: "error", error: String(e) }, 500);
  }
});

// ============================================================
// WHATSAPP LEADS ANALYTICS
// ============================================================
app.get("/api/public/analytics/whatsapp-leads", async (c) => {
  const db = drizzle(c.env.DB, { schema });

  const totalLeads = await db.select({ count: count() }).from(schema.whatsappLeads).get();
  const totalShares = await db.select({ count: count() }).from(schema.cardShares).get();
  const completedShares = await db
    .select({ count: count() })
    .from(schema.cardShares)
    .where(eq(schema.cardShares.status, "completed"))
    .get();

  const topSlides = await db
    .select({ slideId: schema.cardShares.slideId, count: count() })
    .from(schema.cardShares)
    .where(eq(schema.cardShares.status, "completed"))
    .groupBy(schema.cardShares.slideId)
    .orderBy(desc(count()))
    .limit(5);

  const recentLeads = await db
    .select()
    .from(schema.whatsappLeads)
    .orderBy(desc(schema.whatsappLeads.lastShareAt))
    .limit(20);

  return c.json({
    data: {
      totalLeads: totalLeads?.count ?? 0,
      totalShares: totalShares?.count ?? 0,
      completedShares: completedShares?.count ?? 0,
      conversionRate:
        (totalShares?.count ?? 0) > 0
          ? (((completedShares?.count ?? 0) / (totalShares?.count ?? 0)) * 100).toFixed(1)
          : "0.0",
      topSlides,
      recentLeads,
    },
  });
});

// ============================================================
// ADMIN: RESET ALL DATA
// ============================================================
app.post("/api/admin/reset", async (c) => {
  const token = c.req.header("X-Reset-Token");
  if (token !== "jamesstyle-reset-2025") {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = drizzle(c.env.DB, { schema });
  await db.delete(schema.reactions);
  await db.delete(schema.visitorEvents);
  await db.delete(schema.visitorSessions);

  return c.json({ data: { success: true, message: "All analytics data has been reset." } });
});

export default app;
