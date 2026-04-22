import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const reactions = sqliteTable("reactions", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  slideId: integer("slide_id", { mode: "number" }).notNull(),
  reactionType: text("reaction_type").notNull(),
  createdAt: integer("created_at", { mode: "number" }).default(sql`unixepoch()`).notNull(),
  sessionId: text("session_id"),
});

export const visitorSessions = sqliteTable("visitor_sessions", {
  id: text("id").primaryKey(),
  fingerprint: text("fingerprint"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  deviceType: text("device_type").default("unknown"),
  screenWidth: integer("screen_width", { mode: "number" }),
  screenHeight: integer("screen_height", { mode: "number" }),
  language: text("language"),
  sessionStart: integer("session_start", { mode: "number" }).default(sql`unixepoch()`).notNull(),
  lastActive: integer("last_active", { mode: "number" }).default(sql`unixepoch()`).notNull(),
  totalSlidesViewed: integer("total_slides_viewed", { mode: "number" }).default(0),
  maxSlideReached: integer("max_slide_reached", { mode: "number" }).default(0),
  completedGallery: integer("completed_gallery", { mode: "number" }).default(0),
  tookQuiz: integer("took_quiz", { mode: "number" }).default(0),
  quizResult: integer("quiz_result", { mode: "number" }),
});

export const visitorEvents = sqliteTable("visitor_events", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  eventType: text("event_type").notNull(),
  slideId: integer("slide_id", { mode: "number" }),
  eventData: text("event_data"),
  durationMs: integer("duration_ms", { mode: "number" }),
  createdAt: integer("created_at", { mode: "number" }).default(sql`unixepoch()`).notNull(),
});
