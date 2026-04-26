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

export const deviceMetrics = sqliteTable("device_metrics", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  deviceType: text("device_type"),
  screenWidth: integer("screen_width", { mode: "number" }),
  screenHeight: integer("screen_height", { mode: "number" }),
  devicePixelRatio: integer("device_pixel_ratio", { mode: "number" }),
  orientation: text("orientation"),
  os: text("os"),
  browser: text("browser"),
  fcpMs: integer("fcp_ms", { mode: "number" }),
  connectionType: text("connection_type"),
  language: text("language"),
  timezone: text("timezone"),
  memoryGb: integer("memory_gb", { mode: "number" }),
  touchLatencyMs: integer("touch_latency_ms", { mode: "number" }),
  maxTouchPoints: integer("max_touch_points", { mode: "number" }),
  createdAt: integer("created_at", { mode: "number" }).default(sql`unixepoch()`).notNull(),
});

export const cardShares = sqliteTable("card_shares", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  sessionId: text("session_id"),
  slideId: integer("slide_id", { mode: "number" }).notNull(),
  shareToken: text("share_token").notNull().unique(),
  status: text("status").default("pending"),
  sharedAt: integer("shared_at", { mode: "number" }),
  createdAt: integer("created_at", { mode: "number" }).default(sql`unixepoch()`).notNull(),
});

export const whatsappLeads = sqliteTable("whatsapp_leads", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  phone: text("phone").notNull().unique(),
  firstContactAt: integer("first_contact_at", { mode: "number" }).default(sql`unixepoch()`).notNull(),
  source: text("source").default("card_share"),
  shareCount: integer("share_count", { mode: "number" }).default(1),
  lastShareAt: integer("last_share_at", { mode: "number" }),
  conversationHistory: text("conversation_history"),
});
