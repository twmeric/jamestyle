import { createEdgeSpark } from "@edgespark/client";

// Create EdgeSpark client - uses Cloudflare Workers URL for cross-origin backend
const API_BASE_URL = "https://jamestyle-analytics.jimsbond007.workers.dev";
const client = createEdgeSpark({
  baseUrl: API_BASE_URL,
});

const ADMIN_TOKEN = "jamestyle-admin-2025";

export interface ReactionCount {
  slideId: number;
  reactionType: string;
  count: number;
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================

function generateUUID(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|opera\s*m/i.test(ua)) return "mobile";
  return "desktop";
}

// Simple fingerprint based on stable browser characteristics
function generateFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
  ];
  // Simple hash
  let hash = 0;
  const str = components.join("|");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit int
  }
  return "fp_" + Math.abs(hash).toString(36);
}

const SESSION_KEY = "azhan_session_id";
const SESSION_CREATED_KEY = "azhan_session_created";

export function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
    localStorage.setItem(SESSION_CREATED_KEY, Date.now().toString());
  }
  return sessionId;
}

// Initialize session on the backend
export async function initSession(): Promise<string> {
  const sessionId = getSessionId();

  try {
    await client.api.fetch("/api/public/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        fingerprint: generateFingerprint(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || null,
        deviceType: getDeviceType(),
        screenWidth: screen.width,
        screenHeight: screen.height,
        language: navigator.language,
      }),
    });
    console.log("[Session] Initialized:", sessionId);
  } catch (e) {
    console.warn("[Session] Failed to init:", e);
  }

  return sessionId;
}

// Update session metrics
export async function updateSession(data: Record<string, any>): Promise<void> {
  const sessionId = getSessionId();
  try {
    await client.api.fetch(`/api/public/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.warn("[Session] Failed to update:", e);
  }
}

// ============================================================
// EVENT TRACKING
// ============================================================

// Event queue for batching
let eventQueue: Array<{
  sessionId: string;
  eventType: string;
  slideId?: number;
  eventData?: any;
  durationMs?: number;
}> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flushEvents, 3000); // Batch every 3 seconds
}

async function flushEvents() {
  flushTimer = null;
  if (eventQueue.length === 0) return;

  const eventsToSend = [...eventQueue];
  eventQueue = [];

  try {
    await client.api.fetch("/api/public/events/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: eventsToSend }),
    });
    console.log("[Events] Flushed", eventsToSend.length, "events");
  } catch (e) {
    console.warn("[Events] Failed to flush, re-queuing:", e);
    eventQueue = [...eventsToSend, ...eventQueue]; // Re-queue on failure
  }
}

// Flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (eventQueue.length > 0) {
      // Use sendBeacon for reliable delivery on page close
      const payload = JSON.stringify({ events: eventQueue });
      const baseUrl = API_BASE_URL;
      navigator.sendBeacon(
        `${baseUrl}/api/public/events/batch`,
        new Blob([payload], { type: "application/json" })
      );
    }
  });
}

export function trackEvent(
  eventType: string,
  slideId?: number,
  eventData?: any,
  durationMs?: number
): void {
  const sessionId = getSessionId();
  eventQueue.push({
    sessionId,
    eventType,
    slideId,
    eventData,
    durationMs,
  });
  scheduleFlush();
}

// Immediate send for important events (reactions)
export async function trackEventImmediate(
  eventType: string,
  slideId?: number,
  eventData?: any,
  durationMs?: number
): Promise<void> {
  const sessionId = getSessionId();
  try {
    await client.api.fetch("/api/public/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        eventType,
        slideId,
        eventData,
        durationMs,
      }),
    });
  } catch (e) {
    console.warn("[Events] Failed immediate track:", e);
  }
}

// ============================================================
// SLIDE TIMING TRACKER
// ============================================================

let currentSlideStart: number | null = null;
let currentSlideId: number | null = null;

export function startSlideTimer(slideId: number): void {
  // If there was a previous slide, log its duration
  if (currentSlideId !== null && currentSlideStart !== null) {
    const duration = Date.now() - currentSlideStart;
    trackEvent("slide_view", currentSlideId, null, duration);
  }
  currentSlideId = slideId;
  currentSlideStart = Date.now();
}

export function stopSlideTimer(): void {
  if (currentSlideId !== null && currentSlideStart !== null) {
    const duration = Date.now() - currentSlideStart;
    trackEvent("slide_view", currentSlideId, null, duration);
    currentSlideId = null;
    currentSlideStart = null;
  }
}

// ============================================================
// REACTIONS API (enhanced with session tracking)
// ============================================================

export async function fetchAllReactions(): Promise<Record<number, Record<string, number>>> {
  try {
    const res = await client.api.fetch("/api/public/reactions");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data: ReactionCount[] };
    
    const map: Record<number, Record<string, number>> = {};
    for (const r of json.data) {
      if (!map[r.slideId]) map[r.slideId] = {};
      map[r.slideId][r.reactionType] = r.count;
    }
    return map;
  } catch (e) {
    console.warn("[Reactions] Failed to fetch reactions:", e);
    return {};
  }
}

export async function postReaction(
  slideId: number,
  reactionType: string
): Promise<Record<string, number>> {
  const sessionId = getSessionId();
  try {
    // Track the reaction event immediately
    trackEventImmediate("reaction", slideId, { reactionType });

    const res = await client.api.fetch("/api/public/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slideId, reactionType, sessionId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as {
      data: { id: number; counts: { reactionType: string; count: number }[] };
    };
    
    const counts: Record<string, number> = {};
    for (const c of json.data.counts) {
      counts[c.reactionType] = c.count;
    }
    return counts;
  } catch (e) {
    console.warn("[Reactions] Failed to post reaction:", e);
    return {};
  }
}

export async function fetchSlideReactions(
  slideId: number
): Promise<Record<string, number>> {
  try {
    const res = await client.api.fetch(`/api/public/reactions/${slideId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as {
      data: { reactionType: string; count: number }[];
    };
    
    const counts: Record<string, number> = {};
    for (const c of json.data) {
      counts[c.reactionType] = c.count;
    }
    return counts;
  } catch (e) {
    console.warn("[Reactions] Failed to fetch slide reactions:", e);
    return {};
  }
}

// ============================================================
// ANALYTICS API (for dashboard)
// ============================================================

export async function fetchAnalyticsSummary(): Promise<any> {
  try {
    const res = await client.api.fetch("/api/public/analytics/summary", {
      headers: { "X-Admin-Token": ADMIN_TOKEN },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data: any };
    return json.data;
  } catch (e) {
    console.warn("[Analytics] Failed to fetch summary:", e);
    return null;
  }
}

export async function fetchSlideHeatmap(): Promise<any> {
  try {
    const res = await client.api.fetch("/api/public/analytics/slide-heatmap", {
      headers: { "X-Admin-Token": ADMIN_TOKEN },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data: any };
    return json.data;
  } catch (e) {
    console.warn("[Analytics] Failed to fetch heatmap:", e);
    return null;
  }
}

export async function fetchFanScores(): Promise<any> {
  try {
    const res = await client.api.fetch("/api/public/analytics/fan-scores", {
      headers: { "X-Admin-Token": ADMIN_TOKEN },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data: any };
    return json.data;
  } catch (e) {
    console.warn("[Analytics] Failed to fetch fan scores:", e);
    return null;
  }
}

export async function fetchTimeline(days: number = 7): Promise<any> {
  try {
    const res = await client.api.fetch(`/api/public/analytics/timeline?days=${days}`, {
      headers: { "X-Admin-Token": ADMIN_TOKEN },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data: any };
    return json.data;
  } catch (e) {
    console.warn("[Analytics] Failed to fetch timeline:", e);
    return null;
  }
}

export async function fetchOpeningFunnel(): Promise<any> {
  try {
    const res = await client.api.fetch("/api/public/analytics/opening-funnel", {
      headers: { "X-Admin-Token": ADMIN_TOKEN },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data: any };
    return json.data;
  } catch (e) {
    console.warn("[Analytics] Failed to fetch opening funnel:", e);
    return null;
  }
}

// ============================================================
// MOBILE METRICS
// ============================================================
export async function submitDeviceMetrics(data: {
  sessionId: string;
  deviceType: string;
  screenWidth?: number;
  screenHeight?: number;
  devicePixelRatio?: number;
  orientation?: string;
  os?: string;
  browser?: string;
  fcpMs?: number;
  connectionType?: string;
  language?: string;
  timezone?: string;
  memoryGb?: number;
  maxTouchPoints?: number;
}): Promise<void> {
  try {
    await client.api.fetch("/api/public/device-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.warn("[Mobile] Failed to submit metrics:", e);
  }
}

export async function fetchSetting(key: string): Promise<string | null> {
  try {
    const res = await client.api.fetch(`/api/public/settings/${key}`);
    if (!res.ok) return null;
    const json = await res.json() as { data: { value: string } | null };
    return json.data?.value ?? null;
  } catch {
    return null;
  }
}

export async function updateSetting(key: string, value: string): Promise<boolean> {
  try {
    const res = await client.api.fetch("/api/admin/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Reset-Token": "jamesstyle-reset-2025",
      },
      body: JSON.stringify({ key, value }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchDeviceAnalytics(): Promise<any> {
  try {
    const res = await client.api.fetch("/api/public/analytics/device", {
      headers: { "X-Admin-Token": ADMIN_TOKEN },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data: any };
    return json.data;
  } catch (e) {
    console.warn("[Analytics] Failed to fetch device analytics:", e);
    return null;
  }
}

export async function postEmotionVote(slideId: number, emotion: string): Promise<void> {
  try {
    await trackEventImmediate('emotion_vote', slideId, { emotion, slideId });
  } catch (e) {
    console.warn('[Emotion] Failed to post vote:', e);
  }
}

export async function fetchEngagementAnalytics(): Promise<any> {
  try {
    const res = await client.api.fetch("/api/public/analytics/engagement", {
      headers: { "X-Admin-Token": ADMIN_TOKEN },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data: any };
    return json.data;
  } catch (e) {
    console.warn("[Analytics] Failed to fetch engagement analytics:", e);
    return null;
  }
}

export async function fetchWhatsAppLeads(): Promise<any> {
  try {
    const res = await client.api.fetch("/api/public/analytics/whatsapp-leads", {
      headers: { "X-Admin-Token": ADMIN_TOKEN },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data: any };
    return json.data;
  } catch (e) {
    console.warn("[Analytics] Failed to fetch WhatsApp leads:", e);
    return null;
  }
}

export async function fetchConversionFunnel(): Promise<any> {
  try {
    const res = await client.api.fetch("/api/public/analytics/conversion-funnel", {
      headers: { "X-Admin-Token": ADMIN_TOKEN },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data: any };
    return json.data;
  } catch (e) {
    console.warn("[Analytics] Failed to fetch conversion funnel:", e);
    return null;
  }
}

export async function fetchCardDownloads(): Promise<any> {
  try {
    const res = await client.api.fetch("/api/public/analytics/card-downloads", {
      headers: { "X-Admin-Token": ADMIN_TOKEN },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data: any };
    return json.data;
  } catch (e) {
    console.warn("[Analytics] Failed to fetch card downloads:", e);
    return null;
  }
}

export async function fetchCustomerJourney(phone: string): Promise<any> {
  try {
    const res = await client.api.fetch(`/api/public/analytics/customer-journey/${encodeURIComponent(phone)}`, {
      headers: { "X-Admin-Token": ADMIN_TOKEN },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data: any };
    return json.data;
  } catch (e) {
    console.warn("[Analytics] Failed to fetch customer journey:", e);
    return null;
  }
}

export async function fetchQuoteReactions(): Promise<any> {
  try {
    const res = await client.api.fetch("/api/public/analytics/quote-reactions", {
      headers: { "X-Admin-Token": ADMIN_TOKEN },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data: any };
    return json.data;
  } catch (e) {
    console.warn("[Analytics] Failed to fetch quote reactions:", e);
    return null;
  }
}

export async function fetchSubscribers(): Promise<any> {
  try {
    const res = await client.api.fetch("/api/public/analytics/subscribers", {
      headers: { "X-Admin-Token": ADMIN_TOKEN },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data: any };
    return json.data;
  } catch (e) {
    console.warn("[Analytics] Failed to fetch subscribers:", e);
    return null;
  }
}

export async function fetchDropOff(): Promise<any> {
  try {
    const res = await client.api.fetch("/api/public/analytics/drop-off", {
      headers: { "X-Admin-Token": ADMIN_TOKEN },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data: any };
    return json.data;
  } catch (e) {
    console.warn("[Analytics] Failed to fetch drop-off:", e);
    return null;
  }
}

export async function fetchContentPerformance(): Promise<any> {
  try {
    const res = await client.api.fetch("/api/public/analytics/content-performance", {
      headers: { "X-Admin-Token": ADMIN_TOKEN },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data: any };
    return json.data;
  } catch (e) {
    console.warn("[Analytics] Failed to fetch content performance:", e);
    return null;
  }
}

export async function fetchConversionPaths(): Promise<any> {
  try {
    const res = await client.api.fetch("/api/public/analytics/conversion-paths", {
      headers: { "X-Admin-Token": ADMIN_TOKEN },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as { data: any };
    return json.data;
  } catch (e) {
    console.warn("[Analytics] Failed to fetch conversion paths:", e);
    return null;
  }
}

// ============================================================
// CARD SHARE REQUEST (for WhatsApp deeplink)
// ============================================================

export async function requestCardShare(slideId: number, sessionId?: string) {
  const res = await client.api.fetch("/api/public/card-share/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slideId, sessionId }),
  });
  return res.json();
}
