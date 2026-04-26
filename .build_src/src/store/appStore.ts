import { create } from 'zustand';
import {
  fetchAllReactions,
  postReaction,
  initSession,
  trackEvent,
  trackEventImmediate,
  updateSession,
  startSlideTimer,
  stopSlideTimer,
  submitDeviceMetrics,
  getSessionId,
} from '../api/reactionsApi';
import { setSoundEnabled as _setSoundEnabled, isSoundEnabled, toggleSound as _toggleSound } from '../utils/soundManager';
import { unlockAchievement } from '../utils/achievements';

type Lang = 'tc' | 'sc';

interface AppState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  currentSlide: number;
  setCurrentSlide: (n: number) => void;
  showShareModal: boolean;
  setShowShareModal: (v: boolean) => void;
  shareSlideId: number | null;
  setShareSlideId: (id: number | null) => void;
  favorites: number[];
  toggleFavorite: (id: number) => void;
  // Local user reactions (which emojis they've clicked)
  reactions: Record<number, string[]>;
  addReaction: (slideId: number, type: string) => void;
  // Backend reaction counts (real data from DB)
  backendCounts: Record<number, Record<string, number>>;
  setBackendCounts: (counts: Record<number, Record<string, number>>) => void;
  updateSlideCounts: (slideId: number, counts: Record<string, number>) => void;
  loadReactions: () => Promise<void>;
  submitReaction: (slideId: number, type: string) => Promise<void>;
  phase: 'healing' | 'opening' | 'gallery' | 'ending';
  setPhase: (p: 'healing' | 'opening' | 'gallery' | 'ending') => void;
  isAutoPlaying: boolean;
  setIsAutoPlaying: (v: boolean) => void;
  // Analytics tracking
  sessionReady: boolean;
  initTracking: () => Promise<void>;
  slidesViewed: Set<number>;
  maxSlideReached: number;
  trackSlideChange: (slideIdx: number, slideId: number) => void;
  trackInsight: (slideId: number, action: 'open' | 'close') => void;
  trackShare: (slideId: number, action: 'open' | 'click', platform?: string) => void;
  // Opening phase tracking
  trackOpeningEvent: (eventType: string, data?: any) => void;
  trackBubblePop: (bubbleId: number, label: string, isAuto: boolean) => void;
  trackSlideSwipe: (slideId: number, direction: 'next' | 'prev', velocity: number) => void;
  trackInsightRead: (slideId: number, durationMs: number) => void;
  trackQuizAnswer: (step: number, answerIdx: number, durationMs: number) => void;
  trackShareAction: (slideId: number, action: 'download' | 'whatsapp' | 'webshare', success: boolean) => void;
  trackTouchLatency: (latencyMs: number) => void;
  // Sound
  soundEnabled: boolean;
  toggleSound: () => boolean;
  // Emotion voting
  emotionVotes: Record<number, string>;
  submitEmotionVote: (slideId: number, emotion: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  lang: 'tc',
  setLang: (lang) => set({ lang }),
  currentSlide: 0,
  setCurrentSlide: (n) => set({ currentSlide: n }),
  showShareModal: false,
  setShowShareModal: (v) => set({ showShareModal: v }),
  shareSlideId: null,
  setShareSlideId: (id) => set({ shareSlideId: id }),
  favorites: [],
  toggleFavorite: (id) => {
    set((state) => ({
      favorites: state.favorites.includes(id)
        ? state.favorites.filter((f) => f !== id)
        : [...state.favorites, id],
    }));
    trackEvent('favorite_toggle', id, { action: get().favorites.includes(id) ? 'remove' : 'add' });
  },
  reactions: {},
  addReaction: (slideId, type) =>
    set((state) => ({
      reactions: {
        ...state.reactions,
        [slideId]: [...(state.reactions[slideId] || []), type],
      },
    })),
  backendCounts: {},
  setBackendCounts: (counts) => set({ backendCounts: counts }),
  updateSlideCounts: (slideId, counts) =>
    set((state) => ({
      backendCounts: {
        ...state.backendCounts,
        [slideId]: counts,
      },
    })),
  loadReactions: async () => {
    const counts = await fetchAllReactions();
    set({ backendCounts: counts });
  },
  submitReaction: async (slideId, type) => {
    // Optimistic: add to local reactions immediately
    get().addReaction(slideId, type);
    // Post to backend and update counts
    const updatedCounts = await postReaction(slideId, type);
    if (Object.keys(updatedCounts).length > 0) {
      get().updateSlideCounts(slideId, updatedCounts);
    }
  },
  phase: 'healing',
  setPhase: (p) => {
    const prevPhase = get().phase;
    set({ phase: p });
    trackEvent('phase_change', undefined, { from: prevPhase, to: p });
    if (p === 'ending') {
      stopSlideTimer();
      // Ensure final slide metrics are captured before marking gallery complete
      const finalState = get();
      const finalSlidesViewed = finalState.slidesViewed.size;
      const finalMaxSlide = finalState.maxSlideReached;
      updateSession({
        completedGallery: 1,
        totalSlidesViewed: finalSlidesViewed,
        maxSlideReached: finalMaxSlide,
      });
    }
  },
  isAutoPlaying: false,
  setIsAutoPlaying: (v) => {
    set({ isAutoPlaying: v });
    trackEvent(v ? 'autoplay_start' : 'autoplay_stop');
  },

  // ============================================================
  // ANALYTICS TRACKING
  // ============================================================
  sessionReady: false,
  initTracking: async () => {
    await initSession();
    set({ sessionReady: true });

    // Collect mobile metrics
    try {
      const sessionId = getSessionId();
      const conn = (navigator as any).connection;
      // OS 检测
      const getOS = () => {
        const ua = navigator.userAgent;
        if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
        if (/Android/.test(ua)) return 'Android';
        if (/Windows/.test(ua)) return 'Windows';
        if (/Mac/.test(ua)) return 'macOS';
        if (/Linux/.test(ua)) return 'Linux';
        return 'Other';
      };

      // Browser 检测
      const getBrowser = () => {
        const ua = navigator.userAgent;
        if (/Edg/.test(ua)) return 'Edge';
        if (/OPR|Opera/.test(ua)) return 'Opera';
        if (/Firefox/.test(ua)) return 'Firefox';
        if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari';
        if (/Chrome/.test(ua)) return 'Chrome';
        return 'Other';
      };

      // FCP 性能指标收集
      let fcpMs: number | undefined;
      try {
        const perfEntries = performance.getEntriesByType('paint');
        const fcpEntry = perfEntries.find((e: any) => e.name === 'first-contentful-paint');
        if (fcpEntry) fcpMs = Math.round(fcpEntry.startTime);
      } catch {}

      submitDeviceMetrics({
        sessionId,
        deviceType: getDeviceType(),
        screenWidth: screen.width,
        screenHeight: screen.height,
        devicePixelRatio: window.devicePixelRatio ? Math.round(window.devicePixelRatio * 10) / 10 : undefined,
        orientation: screen.orientation?.type?.includes('landscape') ? 'landscape' : 'portrait',
        connectionType: conn?.effectiveType || conn?.type || 'unknown',
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        memoryGb: (navigator as any).deviceMemory,
        maxTouchPoints: navigator.maxTouchPoints || undefined,
        os: getOS(),
        browser: getBrowser(),
        fcpMs,
      });
    } catch (e) {
      console.warn("[Mobile] Metrics collection failed:", e);
    }

    trackEvent('page_view', undefined, {
      url: window.location.href,
      referrer: document.referrer,
    });
  },

  slidesViewed: new Set<number>(),
  maxSlideReached: 0,

  trackSlideChange: (slideIdx: number, slideId: number) => {
    const state = get();
    const newViewed = new Set(state.slidesViewed);
    newViewed.add(slideId);
    const newMax = Math.max(slideIdx, state.maxSlideReached);
    set({ slidesViewed: newViewed, maxSlideReached: newMax });

    // Start timing the new slide
    startSlideTimer(slideId);

    // Track slide change event
    trackEvent('slide_change', slideId, { slideIndex: slideIdx });

    // Update session metrics (non-blocking)
    updateSession({
      totalSlidesViewed: newViewed.size,
      maxSlideReached: newMax,
    });
  },

  trackInsight: (slideId: number, action: 'open' | 'close') => {
    if (action === 'open') {
      trackEventImmediate('insight_open', slideId);
    } else {
      trackEvent('insight_close', slideId);
    }
  },

  trackShare: (slideId: number, action: 'open' | 'click', platform?: string) => {
    if (action === 'open') {
      trackEvent('share_open', slideId);
    } else {
      trackEventImmediate('share_click', slideId, { platform });
    }
  },

  // Opening phase tracking
  trackOpeningEvent: (eventType: string, data?: any) => {
    trackEvent(eventType, undefined, data);
  },

  trackBubblePop: (bubbleId: number, label: string, isAuto: boolean) => {
    trackEventImmediate('bubble_popped', undefined, {
      bubbleId,
      label,
      isAuto,
      allPopped: isAuto, // auto-pop means all were popped
    });
  },

  trackSlideSwipe: (slideId: number, direction: 'next' | 'prev', velocity: number) => {
    trackEvent('slide_swipe', slideId, { direction, velocity: Math.round(velocity) });
  },

  trackInsightRead: (slideId: number, durationMs: number) => {
    trackEvent('insight_read', slideId, { durationMs });
  },

  trackQuizAnswer: (step: number, answerIdx: number, durationMs: number) => {
    trackEvent('quiz_answer', undefined, { step, answerIdx, durationMs });
  },

  trackShareAction: (slideId: number, action: 'download' | 'whatsapp' | 'webshare', success: boolean) => {
    trackEventImmediate('share_action', slideId, { action, success });
  },

  trackTouchLatency: (latencyMs: number) => {
    trackEvent('touch_latency', undefined, { latencyMs });
  },

  // Sound
  soundEnabled: false,
  toggleSound: () => {
    const newState = _toggleSound();
    try {
      localStorage.setItem('azhan_sound_enabled', newState ? '1' : '0');
    } catch {}
    trackEvent('sound_toggle', undefined, { enabled: newState });
    set({ soundEnabled: newState });
    return newState;
  },

  // Emotion voting
  emotionVotes: {},
  submitEmotionVote: (slideId: number, emotion: string) => {
    const state = get();
    const newVotes = { ...state.emotionVotes, [slideId]: emotion };
    set({ emotionVotes: newVotes });
    try {
      localStorage.setItem('azhan_emotion_votes', JSON.stringify(newVotes));
    } catch {}
    trackEventImmediate('emotion_vote', slideId, { emotion, slideId });
    unlockAchievement('emotion_voter');
  },
}));

// Load persisted emotion votes
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('azhan_emotion_votes');
    if (saved) {
      useAppStore.setState({ emotionVotes: JSON.parse(saved) });
    }
  } catch {}
}

// Load persisted sound preference
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('azhan_sound_enabled');
    if (saved === '1') {
      _setSoundEnabled(true);
    }
  } catch {}
}
