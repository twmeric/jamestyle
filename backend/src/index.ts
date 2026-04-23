import { Hono } from "hono";
import { cors } from "hono/cors";
import { eq, and, sql, count, desc, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

// CORS - allow all origins for the static site
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "X-Reset-Token"],
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
  if (data.tookQuiz !== undefined) update.tookQuiz = data.tookQuiz;
  if (data.quizResult !== undefined) update.quizResult = data.quizResult;

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

  const [sessionsResult, reactionsResult, eventsResult, completedResult, quizResult] = await Promise.all([
    db.select({ total: count() }).from(schema.visitorSessions).get(),
    db.select({ total: count() }).from(schema.reactions).get(),
    db.select({ total: count() }).from(schema.visitorEvents).get(),
    db.select({ total: count() }).from(schema.visitorSessions).where(eq(schema.visitorSessions.completedGallery, 1)).get(),
    db.select({ total: count() }).from(schema.visitorSessions).where(eq(schema.visitorSessions.tookQuiz, 1)).get(),
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

  return c.json({
    data: {
      totalSessions,
      totalReactions,
      totalEvents,
      completedGallery: completedResult?.total ?? 0,
      quizTakers: quizResult?.total ?? 0,
      completionRate: totalSessions > 0 ? ((completedResult?.total ?? 0) / totalSessions * 100).toFixed(1) : "0.0",
      quizRate: totalSessions > 0 ? ((quizResult?.total ?? 0) / totalSessions * 100).toFixed(1) : "0.0",
      deviceDistribution: deviceResult,
      topSlides,
    },
  });
});

app.get("/api/public/analytics/slide-heatmap", async (c) => {
  const db = drizzle(c.env.DB, { schema });

  const heatmap = await db
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

  return c.json({ data: { heatmap, reactionsBySlide } });
});

app.get("/api/public/analytics/fan-scores", async (c) => {
  const db = drizzle(c.env.DB, { schema });

  const sessions = await db
    .select()
    .from(schema.visitorSessions)
    .orderBy(desc(schema.visitorSessions.totalSlidesViewed))
    .limit(20);

  const fans = sessions.map((s) => ({
    sessionId: s.id,
    deviceType: s.deviceType,
    slidesViewed: s.totalSlidesViewed,
    maxSlide: s.maxSlideReached,
    reactions: 0,
    score: (s.totalSlidesViewed ?? 0) * 10 + (s.completedGallery ? 50 : 0) + (s.tookQuiz ? 30 : 0),
  }));

  return c.json({ data: fans });
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

  return c.json({ data: { sessionsTimeline, reactionsTimeline } });
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
