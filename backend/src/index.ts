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
  ADMIN_TOKEN?: string;
  CLOUDFLARE_API_TOKEN?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Slide caption data for pre-filled messages (Worker-safe English keys)
const SLIDES: Array<{ id: number; caption: string }> = [
  { id: 1, caption: "人生…就像大便一樣，有軟有硬，有順有不順！" },
  { id: 2, caption: "生活給了我一個巴掌，但我出剪刀！" },
  { id: 3, caption: "現代人怕錯過訊息，從口袋掏出手機的速度，往往比拔鎗更快！" },
  { id: 4, caption: "即使有一千個理由讓你哭，也要找一個理由令自己笑！" },
  { id: 5, caption: "保持快樂的秘訣，其實只是五個字～不要太用力！" },
  { id: 6, caption: "能讓別人快樂的人一定很善良，能讓自己快樂的人一定很聰明！" },
  { id: 7, caption: "每個人都會摸到爛牌，把手上的爛牌打好，是生命裡唯一能做的事！" },
  { id: 8, caption: "學會隻眼開隻眼閉，你可以輕鬆面對身處高峰或谷底！" },
  { id: 9, caption: "與其在別人的劇本裡客串路人甲，不如在自己的戲中擔當主角！" },
  { id: 10, caption: "人生就是用你僅有的一二分甜，去沖淡八九分的苦！" },
  { id: 11, caption: "人生不過三萬天，何不暢飲醉百年！" },
  { id: 12, caption: "愛情同燒味飯一樣，全部都係整定！" },
  { id: 13, caption: "我能百分之九十七的確定你不喜歡我，但我百分之百肯定我不在乎！" },
  { id: 14, caption: "你不為別人擋風遮雨，誰會把你舉在頭上！" },
  { id: 15, caption: "可怕的不是練出一萬招的敵人，而是一招練一萬次的對手！" },
];

// CORS - allow all origins for the static site
app.use("*", cors({
  origin: ["https://jamestyle.com", "https://www.jamestyle.com", "https://159f699d.jamestyle.pages.dev", "http://localhost:5173"],
  allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Reset-Token", "X-Admin-Token"],
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
  if (!verifyAdminToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
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
  if (!verifyAdminToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
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
  if (!verifyAdminToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const db = drizzle(c.env.DB, { schema });

  const sessions = await db
    .select()
    .from(schema.visitorSessions)
    .orderBy(desc(schema.visitorSessions.totalSlidesViewed))
    .limit(20);

  const reactionCounts = await db
    .select({
      sessionId: schema.reactions.sessionId,
      count: count(),
    })
    .from(schema.reactions)
    .groupBy(schema.reactions.sessionId);

  const reactionCountMap = new Map<string, number>();
  reactionCounts.forEach((r) => {
    if (r.sessionId) reactionCountMap.set(r.sessionId, r.count);
  });

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
      reactions: reactionCountMap.get(s.id) ?? 0,
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
  if (!verifyAdminToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
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
  if (!verifyAdminToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
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
    maxTouchPoints: data.maxTouchPoints ?? null,
  });
  return c.json({ success: true });
});

app.get("/api/public/analytics/device", async (c) => {
  if (!verifyAdminToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
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
  if (!verifyAdminToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
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

  // WhatsApp share count (from gallery)
  const whatsappShareResult = await db
    .select({ count: count() })
    .from(schema.visitorEvents)
    .where(eq(schema.visitorEvents.eventType, "whatsapp_share"))
    .get();

  // Gallery page view count (single view / modal opens)
  const galleryPageViewResult = await db
    .select({ count: count() })
    .from(schema.visitorEvents)
    .where(
      and(
        eq(schema.visitorEvents.eventType, "page_view"),
        sql`${schema.visitorEvents.eventData} LIKE '%"source":%'`
      )
    )
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
      whatsappShareCount: whatsappShareResult?.count ?? 0,
      galleryPageViewCount: galleryPageViewResult?.count ?? 0,
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

// R2 random filenames mapping (prevents URL guessing)
const SLIDE_R2_MAP: Record<number, string> = {
  1: "x7k9m2p4.png",
  2: "q3w8e5r1.png",
  3: "b6n4v2c8.png",
  4: "n9m5k3j7.png",
  5: "h2g4f6d8.png",
  6: "p5o7i9u1.png",
  7: "y3t5r7e9.png",
  8: "w2q4s6u8.png",
  9: "a1s3d5f7.png",
  10: "g4h6j8k0.png",
  11: "l2z4x6c8.png",
  12: "v1b3n5m7.png",
  13: "k9j7h5g3.png",
  14: "f2d4s6a8.png",
  15: "e1r3t5y7.png",
};

function getCardImageUrl(slideId: number, _env: Env): string {
  const filename = SLIDE_R2_MAP[slideId];
  if (!filename) {
    return `https://jamestyle.com/cards/slide_${String(slideId).padStart(2, '0')}.png`;
  }
  // Serve from the main domain (static files deployed with Pages)
  return `https://jamestyle.com/cards/${filename}`;
}

app.post("/api/public/card-share/request", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const data = await c.req.json();
  const slideId = data.slideId;
  const sessionId = data.sessionId || null;
  const phone = data.phone || null;

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
    phone,
    createdAt: now,
  });

  // Track event
  await db.insert(schema.visitorEvents).values({
    sessionId: sessionId || "anonymous",
    eventType: "card_share_request",
    slideId,
    eventData: JSON.stringify({ shareToken, phone }),
  });

  const slide = SLIDES.find((s) => s.id === slideId);
  const cardUrl = `https://jamestyle.com/dl/${shareToken}`;
  // Read admin phone from settings, fallback to env or default
  const settingsRow = await db.select().from(schema.settings).where(eq(schema.settings.key, "admin_phone")).get();
  const adminPhone = (settingsRow?.value || c.env.ADMIN_WHATSAPP || "85268810677").replace(/[^\d]/g, "");

  // Pre-filled message for WhatsApp (Salesmartly will receive this and parse slideId)
  const captionSnippet = slide ? slide.caption : "";
  const message = `我想下載阿占語錄卡片 [圖片]\n第${slideId}號作品《${captionSnippet}》\n來自 JameStyle.com`;
  const deepLink = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;

  return c.json({
    success: true,
    shareToken,
    deepLink,
    cardUrl,
    expiresIn: 1800,
  });
});

// ============================================================
// QUOTES API
// ============================================================
app.get("/api/public/quotes", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const results = await db
    .select({
      code: schema.quotes.code,
      title: schema.quotes.title,
      caption: schema.quotes.caption,
      insight: schema.quotes.insight,
      image: schema.quotes.image,
      todayInsight: schema.quotes.todayInsight,
      updatedAt: schema.quotes.updatedAt,
    })
    .from(schema.quotes)
    .orderBy(schema.quotes.orderId, schema.quotes.id);

  return c.json({ quotes: results });
});

app.get("/api/public/quote/:code", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const code = c.req.param("code");

  const result = await db
    .select()
    .from(schema.quotes)
    .where(eq(schema.quotes.code, code))
    .get();

  if (!result) {
    return c.json({ error: "Quote not found" }, 404);
  }

  return c.json(result);
});

app.get("/api/public/quote/:code/today", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const code = c.req.param("code");

  const result = await db
    .select({
      code: schema.quotes.code,
      todayInsight: schema.quotes.todayInsight,
      updatedAt: schema.quotes.updatedAt,
    })
    .from(schema.quotes)
    .where(eq(schema.quotes.code, code))
    .get();

  if (!result) {
    return c.json({ error: "Quote not found" }, 404);
  }

  return c.json(result);
});

app.post("/api/public/quote/:code/react", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const code = c.req.param("code");
  const data = await c.req.json();
  const reactionType = data.reactionType;
  const sessionId = data.sessionId;

  const validReactions = ["like", "love", "laugh", "wow", "sad"];
  if (!validReactions.includes(reactionType)) {
    return c.json({ error: "Invalid reactionType" }, 400);
  }

  // Check if already exists (same session + same reaction type)
  const existing = await db
    .select()
    .from(schema.quoteReactions)
    .where(
      and(
        eq(schema.quoteReactions.quoteCode, code),
        eq(schema.quoteReactions.reactionType, reactionType),
        eq(schema.quoteReactions.sessionId, sessionId)
      )
    )
    .get();

  if (existing) {
    // Toggle off: remove existing reaction
    await db
      .delete(schema.quoteReactions)
      .where(eq(schema.quoteReactions.id, existing.id));
    return c.json({ success: true, action: "removed" });
  } else {
    // Toggle on: add new reaction
    await db.insert(schema.quoteReactions).values({
      quoteCode: code,
      reactionType,
      sessionId,
    });
    return c.json({ success: true, action: "added" });
  }
});

app.get("/api/public/quote/:code/reactions", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const code = c.req.param("code");

  const results = await db
    .select({
      reactionType: schema.quoteReactions.reactionType,
      count: count(),
    })
    .from(schema.quoteReactions)
    .where(eq(schema.quoteReactions.quoteCode, code))
    .groupBy(schema.quoteReactions.reactionType);

  const counts: Record<string, number> = {};
  results.forEach((r) => {
    counts[r.reactionType] = r.count;
  });

  return c.json({ counts });
});

// ============================================================
// SUBSCRIBE API
// ============================================================
app.post("/api/public/subscribe/request", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const data = await c.req.json();
  const code = data.code || "";
  const sessionId = data.sessionId || null;

  if (!code || code.length !== 4) {
    return c.json({ error: "Invalid code" }, 400);
  }

  const now = Math.floor(Date.now() / 1000);

  // Insert subscriber record (phone to be filled by webhook later)
  await db.insert(schema.subscribers).values({
    phone: null,
    name: null,
    sourceCode: code,
    status: "requested",
    createdAt: now,
  });

  // Track event
  await db.insert(schema.visitorEvents).values({
    sessionId: sessionId || "anonymous",
    eventType: "subscribe_request",
    eventData: JSON.stringify({ code }),
  });

  const adminPhone = (c.env.ADMIN_WHATSAPP || "85268810677").replace(/[^\d]/g, "");
  const message = `我想訂閱阿占隨意語錄 [${code}]\n來自 JameStyle.com`;
  const deepLink = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;

  return c.json({
    success: true,
    deepLink,
    code,
  });
});

// Helper: render the quote card page HTML
function renderCardPage(slideId: number, caption: string, token: string, _cardImageUrl: string): string {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>阿占隨意 — 語錄典藏 №${slideId}</title>
  <meta name="description" content="${caption.replace(/"/g, '&quot;')}">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{
      background:#0a0a0a;
      color:#FAF8F3;
      font-family:-apple-system,BlinkMacSystemFont,"PingFang TC","Microsoft JhengHei",sans-serif;
      min-height:100vh;display:flex;flex-direction:column;
      align-items:center;justify-content:center;padding:48px 24px;
    }
    .container{max-width:520px;width:100%;text-align:center}
    .number{font-size:13px;letter-spacing:.25em;color:#C4956A;margin-bottom:12px;opacity:.8}
    .divider{width:32px;height:1px;background:#C4956A;margin:0 auto 40px;opacity:.5}
    .quote{font-size:28px;line-height:1.8;color:#FAF8F3;margin-bottom:28px;font-weight:300;letter-spacing:.02em}
    .author{font-size:15px;color:#C4956A;margin-bottom:56px;letter-spacing:.15em}
    .stamp{font-size:11px;color:rgba(250,248,243,.2);letter-spacing:.2em;margin-bottom:32px}
    .unlock-btn{background:transparent;color:#C4956A;border:1.5px solid #C4956A;padding:16px 48px;font-size:14px;font-weight:500;border-radius:999px;cursor:pointer;letter-spacing:.15em;transition:all .35s}
    .unlock-btn:hover{background:#C4956A;color:#0a0a0a;transform:translateY(-2px);box-shadow:0 8px 28px rgba(196,149,106,.2)}
    .unlock-btn:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none;background:transparent;color:#C4956A}
    .footer{margin-top:64px;font-size:11px;color:rgba(250,248,243,.2);letter-spacing:.15em}
    .tip{margin-top:20px;font-size:12px;color:rgba(250,248,243,.25);line-height:1.8}
    @media(max-width:400px){
      .quote{font-size:22px}
      body{padding:40px 20px}
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="number">№ ${String(slideId).padStart(2,'0')}</div>
    <div class="divider"></div>
    <div class="quote">「${caption}」</div>
    <div class="author">— 阿占隨意</div>
    <div class="stamp">JAMESTYLE · ${new Date().toLocaleDateString('en-GB')}</div>
    <button class="unlock-btn" onclick="unlock()">📥 解鎖高清卡片</button>
    <div class="tip">點擊上方按鈕即可下載專屬語錄卡片<br>僅供個人收藏，禁止商用轉載</div>
    <div class="footer">JameStyle.com</div>
  </div>
  <script>
    async function unlock(){
      const btn=document.querySelector('.unlock-btn');
      btn.disabled=true;btn.textContent='解鎖中...';
      try{
        const res=await fetch('https://jamestyle-analytics.jimsbond007.workers.dev/api/public/card-share/unlock/${token}');
        const data=await res.json();
        if(data.success&&data.downloadUrl){
          btn.textContent='✅ 已解鎖！正在下載...';
          const a=document.createElement('a');
          a.href=data.downloadUrl;
          a.download='jamestyle-card-${slideId}.png';
          document.body.appendChild(a);a.click();document.body.removeChild(a);
          setTimeout(()=>{btn.textContent='📥 再次下載';btn.disabled=false;},3000);
        }else{
          btn.textContent='❌ 連結已失效或已過期';
        }
      }catch(e){
        btn.textContent='❌ 網絡錯誤，請重試';
        setTimeout(()=>{btn.textContent='📥 解鎖高清卡片';btn.disabled=false;},2000);
      }
    }
  </script>
</body>
</html>`;
}

// Card quote page — shows the quote with preview, user must click unlock to download
app.get("/dl/:token", async (c) => {
  return handleCardPage(c);
});

app.get("/api/public/card-download/:token", async (c) => {
  return handleCardPage(c);
});

async function handleCardPage(c: any) {
  const db = drizzle(c.env.DB, { schema });
  const token = c.req.param("token");

  const share = await db
    .select()
    .from(schema.cardShares)
    .where(eq(schema.cardShares.shareToken, token))
    .get();

  if (!share) {
    return c.html(`<!DOCTYPE html><html><body style="background:#0a0a0a;color:#FAF8F3;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;"><div style="text-align:center;"><h1 style="color:#C4956A;font-size:18px;margin-bottom:12px;">連結已失效</h1><p style="color:rgba(250,248,243,.5);font-size:14px;">請回到網站重新索取卡片</p></div></body></html>`, 404);
  }

  const slide = SLIDES.find((s) => s.id === share.slideId);
  const caption = slide ? slide.caption : `第${share.slideId}號作品`;
  const cardImageUrl = getCardImageUrl(share.slideId, c.env);

  // Record page view
  if (share.sessionId) {
    await db.insert(schema.visitorEvents).values({
      sessionId: share.sessionId,
      eventType: "card_page_view",
      slideId: share.slideId,
      eventData: JSON.stringify({ shareToken: token }),
    });
  }

  return c.html(renderCardPage(share.slideId, caption, token, cardImageUrl));
}

// Unlock API — returns the actual PNG download URL
app.get("/api/public/card-share/unlock/:token", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const token = c.req.param("token");
  const now = Math.floor(Date.now() / 1000);

  const share = await db
    .select()
    .from(schema.cardShares)
    .where(eq(schema.cardShares.shareToken, token))
    .get();

  if (!share) {
    return c.json({ success: false, error: "Invalid or expired link" }, 404);
  }

  // Update status to downloaded
  await db
    .update(schema.cardShares)
    .set({ status: "downloaded", downloadedAt: now })
    .where(eq(schema.cardShares.shareToken, token));

  // Track unlock event
  if (share.sessionId) {
    await db.insert(schema.visitorEvents).values({
      sessionId: share.sessionId,
      eventType: "card_unlock_download",
      slideId: share.slideId,
      eventData: JSON.stringify({ shareToken: token, source: "card_page" }),
    });
  }

  const downloadUrl = getCardImageUrl(share.slideId, c.env);
  return c.json({ success: true, downloadUrl });
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
    let matchedToken: string | null = null;
    const tokenMatch = message.match(/jamestyle\.com.*?(\w{16})/i);
    if (tokenMatch) {
      const localToken = tokenMatch[1];
      matchedToken = localToken;
      await db
        .update(schema.cardShares)
        .set({ status: "completed", sharedAt: now })
        .where(eq(schema.cardShares.shareToken, localToken));
    }

    // Try to match with a recent card_share record to enrich lead
    const thirtyMinAgo = now - 1800;
    let matchedShare = null;

    if (matchedToken) {
      matchedShare = await db
        .select()
        .from(schema.cardShares)
        .where(eq(schema.cardShares.shareToken, matchedToken))
        .get();
    }

    if (!matchedShare) {
      matchedShare = await db
        .select()
        .from(schema.cardShares)
        .where(
          and(
            eq(schema.cardShares.phone, phone),
            gte(schema.cardShares.createdAt, thirtyMinAgo)
          )
        )
        .orderBy(desc(schema.cardShares.createdAt))
        .limit(1)
        .get();
    }

    if (matchedShare) {
      await db
        .update(schema.whatsappLeads)
        .set({
          sessionId: matchedShare.sessionId,
          shareToken: matchedShare.shareToken,
          firstSlideId: matchedShare.slideId,
          cardUrl: `https://jamestyle.com/dl/${matchedShare.shareToken}`,
        })
        .where(eq(schema.whatsappLeads.phone, phone));
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
// CARD IMAGE PROXY (serves pre-generated cards from R2 without custom domain)
// ============================================================

app.get("/api/public/card-image/:filename", async (c) => {
  const filename = c.req.param("filename");
  const obj = await c.env.CARD_IMAGES.get(`temp/${filename}`);
  if (!obj) {
    return c.json({ error: "Image not found" }, 404);
  }
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("content-type", obj.httpMetadata?.contentType || "image/png");
  headers.set("cache-control", "public, max-age=86400");
  return new Response(obj.body, { headers });
});

// ============================================================
// CLOUDWAPI HELPERS
// ============================================================

async function sendCloudWapiMessage(env: Env, phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = env.CLOUDWAPI_KEY;
  const sender = env.CLOUDWAPI_SENDER;
  if (!apiKey || !sender) {
    return { success: false, error: "CloudWapi not configured" };
  }
  try {
    // 母機守則：使用 encodeURIComponent 手動編碼中文，不用 URLSearchParams
    const cleanSender = sender.replace(/\D/g, "");
    const cleanNumber = phone.replace(/\D/g, "");
    const encodedMessage = encodeURIComponent(message);
    const url = `https://unofficial.cloudwapi.in/send-message?api_key=${apiKey}&sender=${cleanSender}&number=${cleanNumber}&message=${encodedMessage}`;
    const res = await fetch(url, { method: "GET" });
    return { success: res.ok };
  } catch (e: any) {
    return { success: false, error: String(e) };
  }
}

async function sendCloudWapiMedia(env: Env, phone: string, mediaUrl: string, caption: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = env.CLOUDWAPI_KEY;
  const sender = env.CLOUDWAPI_SENDER;
  if (!apiKey || !sender) {
    return { success: false, error: "CloudWapi not configured" };
  }
  try {
    const pushUrl = new URL("https://unofficial.cloudwapi.in/send-media");
    const body = {
      api_key: apiKey,
      sender: sender.replace(/\D/g, ""),
      number: phone.replace(/\D/g, ""),
      media_type: "image",
      url: mediaUrl,
      caption,
    };
    const res = await fetch(pushUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { success: res.ok };
  } catch (e: any) {
    return { success: false, error: String(e) };
  }
}

// ============================================================
// SALESMARTLY WEBHOOK (V2)
// ============================================================
// Salesmartly forwards user messages to this endpoint.
// Format: {"event":"message","data":{"from":"PHONE","text":"MESSAGE","customer_id":"NAME"}}
// The Worker parses slideId from text, returns a reply message.
// CloudWapi proactively sends the image + link separately.

app.post("/api/webhooks/salesmartly", async (c) => {
  try {
    const body = await c.req.json();
    const event = body.event;
    const data = body.data || {};
    const phone = data.from;
    const text = (data.text || "").trim();
    const customerName = data.customer_id || "";

    // Validate
    if (event !== "message" || !phone) {
      return c.json({ status: "error", message: "Missing phone or event" }, 400);
    }

    // Check for subscribe intent first
    const isSubscribe = /訂閱|subscribe|獲取驚喜/i.test(text);
    if (isSubscribe) {
      const db = drizzle(c.env.DB, { schema });
      const now = Math.floor(Date.now() / 1000);

      // Extract code from message if present
      const codeMatch = text.match(/\[([a-z0-9]{4})\]/i);
      const sourceCode = codeMatch ? codeMatch[1].toLowerCase() : null;

      // 1. Try to find by phone
      let existing = await db
        .select()
        .from(schema.subscribers)
        .where(eq(schema.subscribers.phone, phone))
        .get();

      let isNewSubscriber = !existing;

      if (!existing) {
        // 2. If not found by phone, try to match a recent "requested" record by code
        if (sourceCode) {
          const thirtyMinAgo = now - 1800;
          const pendingRecord = await db
            .select()
            .from(schema.subscribers)
            .where(
              and(
                eq(schema.subscribers.sourceCode, sourceCode),
                eq(schema.subscribers.status, "requested"),
                gte(schema.subscribers.createdAt, thirtyMinAgo)
              )
            )
            .orderBy(desc(schema.subscribers.createdAt))
            .limit(1)
            .get();

          if (pendingRecord) {
            // Link the requested record to this phone
            await db
              .update(schema.subscribers)
              .set({
                phone,
                name: customerName || null,
                status: "confirmed",
              })
              .where(eq(schema.subscribers.id, pendingRecord.id));
            isNewSubscriber = true;
            existing = { ...pendingRecord, phone, status: "confirmed" };
          }
        }

        // 3. Still not found — create new record
        if (!existing) {
          await db.insert(schema.subscribers).values({
            phone,
            name: customerName || null,
            sourceCode,
            status: "confirmed",
            createdAt: now,
          });
        }
      } else if (existing.status === "pending" || existing.status === "requested") {
        await db
          .update(schema.subscribers)
          .set({ status: "confirmed" })
          .where(eq(schema.subscribers.phone, phone));
      }

      // Build personalized welcome message
      let welcomeText: string;
      if (isNewSubscriber) {
        // Try to fetch quote details for personalization
        let quoteTitle = "";
        let quoteCaption = "";
        if (sourceCode) {
          const quoteRow = await db
            .select()
            .from(schema.quotes)
            .where(eq(schema.quotes.code, sourceCode))
            .get();
          if (quoteRow) {
            quoteTitle = quoteRow.title || "";
            quoteCaption = quoteRow.caption || "";
          }
        }
        if (quoteTitle && quoteCaption) {
          const snippet = quoteCaption.length > 40 ? quoteCaption.slice(0, 40) + "…" : quoteCaption;
          welcomeText = `🎉 歡迎加入阿占隨意語錄！\n\n你剛剛睇緊嘅係「${quoteTitle}」——\n${snippet}\n\n我哋會不定期推送最新語錄同小驚喜 ✨\n有咩想傾，隨時搵我。\n\n— 阿占隨意`;
        } else {
          welcomeText = `🎉 歡迎加入阿占隨意語錄！\n\n我哋會不定期推送最新語錄同小驚喜 ✨\n有咩想傾，隨時搵我。\n\n— 阿占隨意`;
        }
      } else {
        welcomeText = `多謝你嘅支持！你已經係我哋嘅訂閱用戶 🙏\n\n最新語錄會第一時間通知你，記得留意！`;
      }

      // Proactively send welcome message via CloudWapi
      const apiKey = c.env.CLOUDWAPI_KEY;
      const cloudSender = c.env.CLOUDWAPI_SENDER;
      if (apiKey && cloudSender) {
        try {
          await sendCloudWapiMessage(c.env, phone, welcomeText);
        } catch (e) {
          console.error("[CloudWapi] Subscribe welcome send failed:", e);
        }
      }

      // All replies sent via CloudWapi; return bare success to Salesmartly
      return c.json({ status: "success" });
    }

    // Parse slideId from message: match "第X號" or "第 X 號" or just the number
    let slideId: number | null = null;
    const matchZh = text.match(/第\s*(\d+)\s*號/);
    if (matchZh) {
      slideId = parseInt(matchZh[1], 10);
    } else {
      const matchNum = text.match(/\b([1-9]|1[0-5])\b/);
      if (matchNum) slideId = parseInt(matchNum[1], 10);
    }

    // If no valid slideId, just acknowledge (Salesmartly doesn't auto-reply)
    if (!slideId || slideId < 1 || slideId > 15) {
      return c.json({ status: "success" });
    }

    const now = Math.floor(Date.now() / 1000);
    const db = drizzle(c.env.DB, { schema });

    // Record/update lead
    const existingLead = await db
      .select()
      .from(schema.whatsappLeads)
      .where(eq(schema.whatsappLeads.phone, phone))
      .get();

    if (existingLead) {
      const history = JSON.parse(existingLead.conversationHistory || "[]");
      history.push({ text, timestamp: new Date().toISOString() });
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
        source: "salesmartly_card_request",
        shareCount: 1,
        lastShareAt: now,
        conversationHistory: JSON.stringify([{ text, timestamp: new Date().toISOString(), name: customerName }]),
      });
    }

    // Try to match with a recent card_share record
    const thirtyMinAgo = now - 1800;
    let matchedShare = await db
      .select()
      .from(schema.cardShares)
      .where(
        and(
          eq(schema.cardShares.phone, phone),
          gte(schema.cardShares.createdAt, thirtyMinAgo)
        )
      )
      .orderBy(desc(schema.cardShares.createdAt))
      .limit(1)
      .get();

    if (!matchedShare) {
      matchedShare = await db
        .select()
        .from(schema.cardShares)
        .where(
          and(
            eq(schema.cardShares.slideId, slideId),
            gte(schema.cardShares.createdAt, thirtyMinAgo)
          )
        )
        .orderBy(desc(schema.cardShares.createdAt))
        .limit(1)
        .get();
    }

    let shareToken: string;
    if (matchedShare) {
      shareToken = matchedShare.shareToken;
      // Update lead with share info
      await db
        .update(schema.whatsappLeads)
        .set({
          sessionId: matchedShare.sessionId,
          shareToken: matchedShare.shareToken,
          firstSlideId: matchedShare.slideId,
          cardUrl: `https://jamestyle.com/dl/${matchedShare.shareToken}`,
        })
        .where(eq(schema.whatsappLeads.phone, phone));
    } else {
      // Generate a new share token for tracking
      shareToken = generateShareToken();
      await db.insert(schema.cardShares).values({
        slideId,
        shareToken,
        status: "pending",
        phone,
        createdAt: now,
      });
      await db
        .update(schema.whatsappLeads)
        .set({
          shareToken,
          firstSlideId: slideId,
          cardUrl: `https://jamestyle.com/dl/${shareToken}`,
        })
        .where(eq(schema.whatsappLeads.phone, phone));
    }

    // Build reply message with card page link (not direct PNG)
    const cardPageUrl = `https://jamestyle.com/dl/${shareToken}`;
    const actualCardUrl = getCardImageUrl(slideId, c.env);
    const slide = SLIDES.find((s) => s.id === slideId);
    const caption = slide ? slide.caption : `第${slideId}號作品`;

    const replyText = `這是你的專屬語錄典藏頁 ✨\n點擊查看第${slideId}號作品《${caption}》\n${cardPageUrl}\n\n⚠️ 每天最多可索取 1 張，明天再來發掘新作品！\n\n感謝支持阿占隨意！`;

    // Proactively send preview image + text via CloudWapi
    const apiKey = c.env.CLOUDWAPI_KEY;
    const cloudSender = c.env.CLOUDWAPI_SENDER;
    if (apiKey && cloudSender) {
      try {
        // Send preview image first (watermark is on the page, image itself is full quality)
        await sendCloudWapiMedia(c.env, phone, actualCardUrl, `第${slideId}號作品 — 點擊連結解鎖高清版 ✨`);
        // Then send text with page link
        await sendCloudWapiMessage(c.env, phone, replyText);
      } catch (e) {
        console.error("[CloudWapi] Proactive send failed:", e);
      }
    }

    // All replies sent via CloudWapi; return bare success to Salesmartly
    return c.json({ status: "success" });
  } catch (e: any) {
    console.error("[Webhook] Salesmartly webhook error:", e);
    return c.json({ status: "error", message: String(e) }, 500);
  }
});

// ============================================================
// WHATSAPP LEADS ANALYTICS
// ============================================================
app.get("/api/public/analytics/whatsapp-leads", async (c) => {
  if (!verifyAdminToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const db = drizzle(c.env.DB, { schema });

  const totalLeads = await db.select({ count: count() }).from(schema.whatsappLeads).get();
  const totalShares = await db.select({ count: count() }).from(schema.cardShares).get();
  const completedShares = await db
    .select({ count: count() })
    .from(schema.cardShares)
    .where(eq(schema.cardShares.status, "completed"))
    .get();
  const downloadedShares = await db
    .select({ count: count() })
    .from(schema.cardShares)
    .where(eq(schema.cardShares.status, "downloaded"))
    .get();

  const topSlides = await db
    .select({ slideId: schema.cardShares.slideId, count: count() })
    .from(schema.cardShares)
    .where(eq(schema.cardShares.status, "completed"))
    .groupBy(schema.cardShares.slideId)
    .orderBy(desc(count()))
    .limit(5);

  // Funnel data
  const [browseResult, reactResult, shareRequestResult, whatsappContactResult, clickDownloadResult, actualDownloadResult] = await Promise.all([
    db.select({ count: count() }).from(schema.visitorEvents).where(eq(schema.visitorEvents.eventType, "slide_view")).get(),
    db.select({ count: count() }).from(schema.reactions).get(),
    db.select({ count: count() }).from(schema.visitorEvents).where(eq(schema.visitorEvents.eventType, "card_share_request")).get(),
    db.select({ count: count() }).from(schema.whatsappLeads).get(),
    db.select({ count: count() }).from(schema.cardShares).where(sql`${schema.cardShares.status} = 'completed' OR ${schema.cardShares.status} = 'downloaded'`).get(),
    db.select({ count: count() }).from(schema.cardShares).where(eq(schema.cardShares.status, "downloaded")).get(),
  ]);

  const funnelData = {
    browse: browseResult?.count ?? 0,
    react: reactResult?.count ?? 0,
    shareRequest: shareRequestResult?.count ?? 0,
    whatsappContact: whatsappContactResult?.count ?? 0,
    clickDownload: clickDownloadResult?.count ?? 0,
    actualDownload: actualDownloadResult?.count ?? 0,
  };

  // Conversion paths: top 3 slide→reaction→share→download paths
  const conversionPathsRaw = await db
    .select({
      slideId: schema.cardShares.slideId,
      count: count(),
    })
    .from(schema.cardShares)
    .where(eq(schema.cardShares.status, "downloaded"))
    .groupBy(schema.cardShares.slideId)
    .orderBy(desc(count()))
    .limit(3);

  const conversionPaths = await Promise.all(
    conversionPathsRaw.map(async (p) => {
      const reactionCount = await db
        .select({ count: count() })
        .from(schema.reactions)
        .where(eq(schema.reactions.slideId, p.slideId))
        .get();
      const totalSharesForSlide = await db
        .select({ count: count() })
        .from(schema.cardShares)
        .where(eq(schema.cardShares.slideId, p.slideId))
        .get();
      return {
        slideId: p.slideId,
        reactions: reactionCount?.count ?? 0,
        shares: totalSharesForSlide?.count ?? 0,
        downloads: p.count,
      };
    })
  );

  // Customers: enriched recent leads
  const recentLeadsRaw = await db
    .select()
    .from(schema.whatsappLeads)
    .orderBy(desc(schema.whatsappLeads.lastShareAt))
    .limit(20);

  // Strip conversationHistory from API responses (collected but never displayed)
  const sanitizeLead = (lead: any) => {
    const { conversationHistory, ...rest } = lead;
    return rest;
  };

  const customers = await Promise.all(
    recentLeadsRaw.map(async (lead) => {
      const safeLead = sanitizeLead(lead);
      if (!lead.sessionId) {
        return {
          ...safeLead,
          slidesViewed: 0,
          reactionsCount: 0,
          eventsCount: 0,
        };
      }
      const session = await db
        .select()
        .from(schema.visitorSessions)
        .where(eq(schema.visitorSessions.id, lead.sessionId))
        .get();
      const reactionsCount = await db
        .select({ count: count() })
        .from(schema.reactions)
        .where(eq(schema.reactions.sessionId, lead.sessionId))
        .get();
      const eventsCount = await db
        .select({ count: count() })
        .from(schema.visitorEvents)
        .where(eq(schema.visitorEvents.sessionId, lead.sessionId))
        .get();
      return {
        ...safeLead,
        slidesViewed: session?.totalSlidesViewed ?? 0,
        reactionsCount: reactionsCount?.count ?? 0,
        eventsCount: eventsCount?.count ?? 0,
      };
    })
  );

  return c.json({
    data: {
      totalLeads: totalLeads?.count ?? 0,
      totalShares: totalShares?.count ?? 0,
      completedShares: completedShares?.count ?? 0,
      downloadedShares: downloadedShares?.count ?? 0,
      conversionRate:
        (totalShares?.count ?? 0) > 0
          ? (((downloadedShares?.count ?? 0) / (totalShares?.count ?? 0)) * 100).toFixed(1)
          : "0.0",
      topSlides,
      funnelData,
      conversionPaths,
      recentLeads: recentLeadsRaw.map(sanitizeLead),
      customers,
    },
  });
});

app.get("/api/public/analytics/customer-journey/:phone", async (c) => {
  if (!verifyAdminToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const db = drizzle(c.env.DB, { schema });
  const phone = c.req.param("phone");

  const lead = await db
    .select()
    .from(schema.whatsappLeads)
    .where(eq(schema.whatsappLeads.phone, phone))
    .get();

  if (!lead) {
    return c.json({ error: "Lead not found" }, 404);
  }

  let session = null;
  let events: any[] = [];
  let reactions: any[] = [];
  let shares: any[] = [];

  if (lead.sessionId) {
    session = await db
      .select()
      .from(schema.visitorSessions)
      .where(eq(schema.visitorSessions.id, lead.sessionId))
      .get();

    events = await db
      .select()
      .from(schema.visitorEvents)
      .where(eq(schema.visitorEvents.sessionId, lead.sessionId))
      .orderBy(schema.visitorEvents.createdAt);

    reactions = await db
      .select()
      .from(schema.reactions)
      .where(eq(schema.reactions.sessionId, lead.sessionId))
      .orderBy(schema.reactions.createdAt);

    shares = await db
      .select()
      .from(schema.cardShares)
      .where(eq(schema.cardShares.sessionId, lead.sessionId))
      .orderBy(desc(schema.cardShares.createdAt));
  }

  // Sanitize session: remove fingerprinting / PII fields
  const safeSession = session
    ? (({ fingerprint, userAgent, referrer, ...rest }) => rest)(session)
    : null;

  // Sanitize lead: remove conversationHistory
  const safeLead = lead
    ? (({ conversationHistory, ...rest }) => rest)(lead)
    : null;

  return c.json({
    data: {
      customer: safeLead,
      session: safeSession,
      events,
      reactions,
      shares,
    },
  });
});

app.get("/api/public/analytics/card-downloads", async (c) => {
  if (!verifyAdminToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const db = drizzle(c.env.DB, { schema });

  const totalDownloads = await db
    .select({ count: count() })
    .from(schema.cardShares)
    .where(eq(schema.cardShares.status, "downloaded"))
    .get();

  const totalShares = await db
    .select({ count: count() })
    .from(schema.cardShares)
    .get();

  const downloadsBySlide = await db
    .select({
      slideId: schema.cardShares.slideId,
      count: count(),
    })
    .from(schema.cardShares)
    .where(eq(schema.cardShares.status, "downloaded"))
    .groupBy(schema.cardShares.slideId)
    .orderBy(desc(count()));

  const days = 30;
  const since = Math.floor(Date.now() / 1000) - days * 86400;

  const downloadsPerDay = await db
    .select({
      date: sql<string>`date(${schema.cardShares.downloadedAt}, 'unixepoch')`,
      count: count(),
    })
    .from(schema.cardShares)
    .where(
      and(
        eq(schema.cardShares.status, "downloaded"),
        gte(schema.cardShares.downloadedAt, since)
      )
    )
    .groupBy(sql`date(${schema.cardShares.downloadedAt}, 'unixepoch')`);

  const downloadRate =
    (totalShares?.count ?? 0) > 0
      ? (((totalDownloads?.count ?? 0) / (totalShares?.count ?? 0)) * 100).toFixed(1)
      : "0.0";

  return c.json({
    data: {
      totalDownloads: totalDownloads?.count ?? 0,
      downloadsBySlide,
      downloadsPerDay,
      downloadRate,
    },
  });
});

app.get("/api/public/analytics/conversion-funnel", async (c) => {
  if (!verifyAdminToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const db = drizzle(c.env.DB, { schema });

  const [browseResult, reactResult, shareRequestResult, whatsappContactResult, clickDownloadResult, actualDownloadResult] = await Promise.all([
    db.select({ count: count() }).from(schema.visitorEvents).where(eq(schema.visitorEvents.eventType, "slide_view")).get(),
    db.select({ count: count() }).from(schema.reactions).get(),
    db.select({ count: count() }).from(schema.visitorEvents).where(eq(schema.visitorEvents.eventType, "card_share_request")).get(),
    db.select({ count: count() }).from(schema.whatsappLeads).get(),
    db.select({ count: count() }).from(schema.cardShares).where(sql`${schema.cardShares.status} = 'completed' OR ${schema.cardShares.status} = 'downloaded'`).get(),
    db.select({ count: count() }).from(schema.cardShares).where(eq(schema.cardShares.status, "downloaded")).get(),
  ]);

  return c.json({
    data: {
      steps: [
        { name: "瀏覽作品", count: browseResult?.count ?? 0 },
        { name: "點擊反應", count: reactResult?.count ?? 0 },
        { name: "分享請求", count: shareRequestResult?.count ?? 0 },
        { name: "WhatsApp聯繫", count: whatsappContactResult?.count ?? 0 },
        { name: "點擊下載連結", count: clickDownloadResult?.count ?? 0 },
        { name: "實際下載", count: actualDownloadResult?.count ?? 0 },
      ],
    },
  });
});

// ============================================================
// DROP-OFF ANALYTICS
// ============================================================
app.get("/api/public/analytics/drop-off", async (c) => {
  if (!verifyAdminToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const db = drizzle(c.env.DB, { schema });

  const slideViews = await db
    .select({
      slideId: schema.visitorEvents.slideId,
      count: sql<number>`count(distinct ${schema.visitorEvents.sessionId})`,
    })
    .from(schema.visitorEvents)
    .where(eq(schema.visitorEvents.eventType, "slide_view"))
    .groupBy(schema.visitorEvents.slideId);

  const viewMap: Record<number, number> = {};
  slideViews.forEach((v) => {
    if (v.slideId !== null) viewMap[v.slideId] = v.count;
  });

  const dropOffs = [];
  let worstDropOff = { slideId: 0, dropOffRate: "0.0" };
  let maxRate = -1;

  for (let n = 1; n <= 14; n++) {
    const viewed = viewMap[n] ?? 0;
    const nextViewed = viewMap[n + 1] ?? 0;
    const rate = viewed > 0 ? ((viewed - nextViewed) / viewed) * 100 : 0;
    const dropOffRate = rate.toFixed(1);
    dropOffs.push({ slideId: n, viewed, nextViewed, dropOffRate });
    if (rate > maxRate) {
      maxRate = rate;
      worstDropOff = { slideId: n, dropOffRate };
    }
  }

  return c.json({
    data: {
      dropOffs,
      worstDropOff: maxRate >= 0 ? worstDropOff : null,
    },
  });
});

// ============================================================
// CONTENT PERFORMANCE
// ============================================================
app.get("/api/public/analytics/content-performance", async (c) => {
  if (!verifyAdminToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const db = drizzle(c.env.DB, { schema });

  const [viewCounts, reactionCounts, shareCounts] = await Promise.all([
    db
      .select({ slideId: schema.visitorEvents.slideId, count: count() })
      .from(schema.visitorEvents)
      .where(eq(schema.visitorEvents.eventType, "slide_view"))
      .groupBy(schema.visitorEvents.slideId),
    db
      .select({ slideId: schema.reactions.slideId, count: count() })
      .from(schema.reactions)
      .groupBy(schema.reactions.slideId),
    db
      .select({ slideId: schema.visitorEvents.slideId, count: count() })
      .from(schema.visitorEvents)
      .where(eq(schema.visitorEvents.eventType, "card_share_request"))
      .groupBy(schema.visitorEvents.slideId),
  ]);

  const viewMap: Record<number, number> = {};
  const reactionMap: Record<number, number> = {};
  const shareMap: Record<number, number> = {};

  viewCounts.forEach((v) => {
    if (v.slideId !== null) viewMap[v.slideId] = v.count;
  });
  reactionCounts.forEach((r) => {
    if (r.slideId !== null) reactionMap[r.slideId] = r.count;
  });
  shareCounts.forEach((s) => {
    if (s.slideId !== null) shareMap[s.slideId] = s.count;
  });

  const slides = [];
  for (let i = 1; i <= 15; i++) {
    const views = viewMap[i] ?? 0;
    const reactions = reactionMap[i] ?? 0;
    const shares = shareMap[i] ?? 0;
    const reactionRate = views > 0 ? ((reactions / views) * 100).toFixed(1) : "0.0";
    const shareRate = views > 0 ? ((shares / views) * 100).toFixed(1) : "0.0";
    slides.push({ slideId: i, views, reactions, reactionRate, shares, shareRate });
  }

  const allQuoteReactions = await db
    .select({
      quoteCode: schema.quoteReactions.quoteCode,
      reactionType: schema.quoteReactions.reactionType,
      count: count(),
    })
    .from(schema.quoteReactions)
    .groupBy(schema.quoteReactions.quoteCode, schema.quoteReactions.reactionType);

  const quoteTotals: Record<string, number> = {};
  const quoteBreakdownMap: Record<string, Record<string, number>> = {};

  allQuoteReactions.forEach((r) => {
    if (!quoteBreakdownMap[r.quoteCode]) quoteBreakdownMap[r.quoteCode] = {};
    quoteBreakdownMap[r.quoteCode][r.reactionType] = r.count;
    quoteTotals[r.quoteCode] = (quoteTotals[r.quoteCode] || 0) + r.count;
  });

  const topQuotes = Object.entries(quoteTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([quoteCode, totalReactions]) => ({
      quoteCode,
      totalReactions,
      reactionBreakdown: quoteBreakdownMap[quoteCode] || {},
    }));

  return c.json({
    data: {
      slides,
      topQuotes,
    },
  });
});

// ============================================================
// CONVERSION PATHS
// ============================================================
app.get("/api/public/analytics/conversion-paths", async (c) => {
  if (!verifyAdminToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const db = drizzle(c.env.DB, { schema });

  const [totalSessionsResult, sessionsWithReactionsResult, sessionsCompletedResult, whatsappLeadsResult, cardSharesResult] = await Promise.all([
    db.select({ count: count() }).from(schema.visitorSessions).get(),
    db.select({ count: sql<number>`count(distinct ${schema.reactions.sessionId})` }).from(schema.reactions).get(),
    db.select({ count: count() }).from(schema.visitorSessions).where(eq(schema.visitorSessions.completedGallery, 1)).get(),
    db.select({ count: count() }).from(schema.whatsappLeads).get(),
    db.select({ count: count() }).from(schema.cardShares).get(),
  ]);

  const totalSessions = totalSessionsResult?.count ?? 0;
  const sessionsWithReactions = sessionsWithReactionsResult?.count ?? 0;
  const sessionsCompleted = sessionsCompletedResult?.count ?? 0;
  const whatsappLeads = whatsappLeadsResult?.count ?? 0;
  const cardShares = cardSharesResult?.count ?? 0;

  const reactionToWhatsApp = sessionsWithReactions > 0 ? ((whatsappLeads / sessionsWithReactions) * 100).toFixed(1) : "0.0";
  const completeToWhatsApp = sessionsCompleted > 0 ? ((whatsappLeads / sessionsCompleted) * 100).toFixed(1) : "0.0";
  const viewToReaction = totalSessions > 0 ? ((sessionsWithReactions / totalSessions) * 100).toFixed(1) : "0.0";

  return c.json({
    data: {
      totalSessions,
      sessionsWithReactions,
      sessionsCompleted,
      whatsappLeads,
      cardShares,
      reactionToWhatsApp,
      completeToWhatsApp,
      viewToReaction,
    },
  });
});

// ============================================================
// QUOTE REACTIONS ANALYTICS
// ============================================================
app.get("/api/public/analytics/quote-reactions", async (c) => {
  if (!verifyAdminToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const db = drizzle(c.env.DB, { schema });

  // Total reactions by type
  const byType = await db
    .select({
      reactionType: schema.quoteReactions.reactionType,
      count: count(),
    })
    .from(schema.quoteReactions)
    .groupBy(schema.quoteReactions.reactionType);

  // Top quotes by total reactions
  const topQuotes = await db
    .select({
      quoteCode: schema.quoteReactions.quoteCode,
      count: count(),
    })
    .from(schema.quoteReactions)
    .groupBy(schema.quoteReactions.quoteCode)
    .orderBy(desc(count()))
    .limit(20);

  // Reaction breakdown per quote
  const quoteBreakdown = await db
    .select({
      quoteCode: schema.quoteReactions.quoteCode,
      reactionType: schema.quoteReactions.reactionType,
      count: count(),
    })
    .from(schema.quoteReactions)
    .groupBy(schema.quoteReactions.quoteCode, schema.quoteReactions.reactionType);

  const breakdownMap: Record<string, Record<string, number>> = {};
  quoteBreakdown.forEach((r) => {
    if (!breakdownMap[r.quoteCode]) breakdownMap[r.quoteCode] = {};
    breakdownMap[r.quoteCode][r.reactionType] = r.count;
  });

  const total = byType.reduce((sum, r) => sum + r.count, 0);

  return c.json({
    data: {
      total,
      byType,
      topQuotes: topQuotes.map((q) => ({ ...q, breakdown: breakdownMap[q.quoteCode] || {} })),
    },
  });
});

// ============================================================
// SUBSCRIBERS ANALYTICS
// ============================================================
app.get("/api/public/analytics/subscribers", async (c) => {
  if (!verifyAdminToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const db = drizzle(c.env.DB, { schema });

  const total = await db.select({ count: count() }).from(schema.subscribers).get();

  const byStatus = await db
    .select({
      status: schema.subscribers.status,
      count: count(),
    })
    .from(schema.subscribers)
    .groupBy(schema.subscribers.status);

  const recent = await db
    .select()
    .from(schema.subscribers)
    .orderBy(desc(schema.subscribers.createdAt))
    .limit(20);

  return c.json({
    data: {
      total: total?.count ?? 0,
      byStatus,
      recent,
    },
  });
});

// ============================================================
// SETTINGS API
// ============================================================
app.get("/api/public/settings/:key", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const key = c.req.param("key");
  const row = await db.select().from(schema.settings).where(eq(schema.settings.key, key)).get();
  return c.json({ data: row ? { key: row.key, value: row.value } : null });
});

app.post("/api/admin/settings", async (c) => {
  const token = c.req.header("X-Reset-Token");
  if (token !== "jamesstyle-reset-2025") {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const db = drizzle(c.env.DB, { schema });
  const { key, value } = await c.req.json();
  if (!key) return c.json({ error: "Missing key" }, 400);

  const existing = await db.select().from(schema.settings).where(eq(schema.settings.key, key)).get();
  const now = Math.floor(Date.now() / 1000);
  if (existing) {
    await db.update(schema.settings).set({ value, updatedAt: now }).where(eq(schema.settings.key, key));
  } else {
    await db.insert(schema.settings).values({ key, value, updatedAt: now });
  }
  return c.json({ data: { success: true, key, value } });
});

// ============================================================
// ADMIN: TODAY INSIGHTS
// ============================================================
function verifyAdminToken(c: any): boolean {
  const token = c.req.header("X-Admin-Token");
  const expected = c.env.ADMIN_TOKEN || "jamestyle-admin-2025";
  return token === expected;
}

app.post("/api/admin/today-insights", async (c) => {
  if (!verifyAdminToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = drizzle(c.env.DB, { schema });
  const body = await c.req.json();
  const insights: Array<{ code: string; today_insight: string }> = body.insights ?? [];

  let updated = 0;
  const now = Math.floor(Date.now() / 1000);

  for (const item of insights) {
    if (!item.code || item.today_insight === undefined) continue;
    const result = await db
      .update(schema.quotes)
      .set({ todayInsight: item.today_insight, updatedAt: now })
      .where(eq(schema.quotes.code, item.code));
    // Drizzle D1 returns meta/changes; treat as updated if we attempted
    updated++;
  }

  return c.json({ updated });
});

// ============================================================
// ADMIN: PURGE CACHE
// ============================================================
app.post("/api/admin/purge-cache", async (c) => {
  if (!verifyAdminToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const cfToken = c.env.CLOUDFLARE_API_TOKEN;
  if (!cfToken) {
    return c.json({ success: true, note: "manual purge required" });
  }

  // Zone ID for jamestyle.com — placeholder; update wrangler env if needed
  const zoneId = "PLACEHOLDER_ZONE_ID";
  if (zoneId === "PLACEHOLDER_ZONE_ID") {
    return c.json({ success: true, note: "manual purge required" });
  }

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ purge_everything: true }),
    });
    const data = await res.json();
    if (data.success) {
      return c.json({ success: true, note: "cache purged" });
    }
    return c.json({ success: false, note: "Cloudflare API error", errors: data.errors }, 502);
  } catch (e: any) {
    return c.json({ success: false, note: e.message || "Request failed" }, 500);
  }
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
  await db.delete(schema.deviceMetrics);
  await db.delete(schema.cardShares);
  await db.delete(schema.whatsappLeads);
  await db.delete(schema.quoteReactions);

  return c.json({ data: { success: true, message: "All analytics data has been reset." } });
});

export default app;
