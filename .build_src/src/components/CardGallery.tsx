import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo, type Transition } from 'framer-motion';
import { SLIDES, ACT_NAMES, ACT_EMOJIS } from '../data/slides';
import { useAppStore } from '../store/appStore';
import { trackEvent, trackEventImmediate } from '../api/reactionsApi';
import { playPageTurn, playReaction } from '../utils/soundManager';
import { unlockAchievement } from '../utils/achievements';

// ===== Multiple Transition Styles for Surprise & Delight =====
type TransitionVariant = {
  initial: Record<string, number>;
  animate: Record<string, number>;
  exit: Record<string, number>;
  transition: Transition;
};

const CARD_TRANSITIONS: TransitionVariant[] = [
  // 1. Classic horizontal slide
  {
    initial: { x: 80, opacity: 0, scale: 0.97 },
    animate: { x: 0, opacity: 1, scale: 1 },
    exit: { x: -80, opacity: 0, scale: 0.97 },
    transition: { type: 'spring', stiffness: 180, damping: 28 },
  },
  // 2. Rise from below with bounce
  {
    initial: { y: 120, opacity: 0, scale: 0.9 },
    animate: { y: 0, opacity: 1, scale: 1 },
    exit: { y: -80, opacity: 0, scale: 0.95 },
    transition: { type: 'spring', stiffness: 200, damping: 22, mass: 0.8 },
  },
  // 3. Scale zoom with bounce
  {
    initial: { scale: 0.5, opacity: 0, y: 0 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: { scale: 1.15, opacity: 0, y: 0 },
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
  // 4. Rotate fan-in from right
  {
    initial: { rotate: 12, x: 100, opacity: 0, scale: 0.92 },
    animate: { rotate: 0, x: 0, opacity: 1, scale: 1 },
    exit: { rotate: -8, x: -60, opacity: 0, scale: 0.95 },
    transition: { type: 'spring', stiffness: 160, damping: 24 },
  },
  // 5. Diagonal slide (bottom-right to center)
  {
    initial: { x: 60, y: 60, opacity: 0, scale: 0.9 },
    animate: { x: 0, y: 0, opacity: 1, scale: 1 },
    exit: { x: -40, y: -40, opacity: 0, scale: 0.92 },
    transition: { type: 'spring', stiffness: 170, damping: 26 },
  },
  // 6. 3D flip (rotateY) — flat values, perspective applied via CSS
  {
    initial: { rotateY: 90, opacity: 0, scale: 0.85 },
    animate: { rotateY: 0, opacity: 1, scale: 1 },
    exit: { rotateY: -90, opacity: 0, scale: 0.85 },
    transition: { type: 'spring', stiffness: 120, damping: 20, mass: 0.9 },
  },
  // 7. Drop from top
  {
    initial: { y: -150, opacity: 0, scale: 0.85, rotate: -5 },
    animate: { y: 0, opacity: 1, scale: 1, rotate: 0 },
    exit: { y: 100, opacity: 0, scale: 0.9, rotate: 3 },
    transition: { type: 'spring', stiffness: 150, damping: 22 },
  },
  // 8. Elastic horizontal with overshoot
  {
    initial: { x: 200, opacity: 0, scale: 1 },
    animate: { x: 0, opacity: 1, scale: 1 },
    exit: { x: -200, opacity: 0, scale: 1 },
    transition: { type: 'spring', stiffness: 300, damping: 18, mass: 0.6 },
  },
];

// Different image entrance effects per transition
const IMG_TRANSITIONS = [
  { initial: { scale: 1.08, opacity: 0.4 }, animate: { scale: 1, opacity: 1 } },
  { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 } },
  { initial: { scale: 1.2, opacity: 0.3 }, animate: { scale: 1, opacity: 1 } },
  { initial: { scale: 1, opacity: 0, rotate: 3 }, animate: { scale: 1, opacity: 1, rotate: 0 } },
  { initial: { scale: 0.85, opacity: 0 }, animate: { scale: 1, opacity: 1 } },
  { initial: { scale: 1.1, opacity: 0 }, animate: { scale: 1, opacity: 1 } },
  { initial: { scale: 1.15, opacity: 0.2, y: -20 }, animate: { scale: 1, opacity: 1, y: 0 } },
  { initial: { scale: 1, opacity: 0, x: 20 }, animate: { scale: 1, opacity: 1, x: 0 } },
];

const REACTION_TYPES = [
  { key: 'heart', emoji: '❤️', label: '紅心' },
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'share', emoji: '📤', label: '分享' },
];

const AUTOPLAY_INTERVAL = 5000;

function formatCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export default function CardGallery() {
  const { lang, currentSlide, setCurrentSlide, favorites, toggleFavorite, reactions, backendCounts, submitReaction, loadReactions, setShowShareModal, setShareSlideId, setPhase, isAutoPlaying, setIsAutoPlaying, trackSlideChange, trackInsight, trackShare, emotionVotes, submitEmotionVote } = useAppStore();
  const [showInsight, setShowInsight] = useState<number | null>(null);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [autoplayKey, setAutoplayKey] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const emojiCounter = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reactionsLoaded = useRef(false);
  const insightOpenTimeRef = useRef<number>(0);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-5, 5]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const slide = SLIDES[currentSlide];
  const actName = ACT_NAMES[lang][slide?.act ?? 0];
  const actEmoji = ACT_EMOJIS[slide?.act ?? 0];

  // Load reactions from backend on mount & track initial slide
  useEffect(() => {
    if (!reactionsLoaded.current) {
      reactionsLoaded.current = true;
      loadReactions();
      // Track initial slide view
      if (SLIDES[0]) trackSlideChange(0, SLIDES[0].id);
    }
  }, [loadReactions, trackSlideChange]);

  const hasReachedEndRef = useRef(false);

  const goNext = useCallback(() => {
    if (currentSlide < SLIDES.length - 1) {
      if (insightOpenTimeRef.current > 0) {
        const duration = Date.now() - insightOpenTimeRef.current;
        trackEvent('insight_read', SLIDES[currentSlide].id, { durationMs: duration });
        insightOpenTimeRef.current = 0;
      }
      setShowInsight(null);
      setDirection('next');
      const nextIdx = currentSlide + 1;
      setCurrentSlide(nextIdx);
      trackSlideChange(nextIdx, SLIDES[nextIdx].id);
      playPageTurn();
      if (nextIdx === SLIDES.length - 1) {
        hasReachedEndRef.current = true;
        unlockAchievement('gallery_complete');
      }
    } else {
      setIsAutoPlaying(false);
      setPhase('ending');
    }
  }, [currentSlide, setCurrentSlide, setPhase, setIsAutoPlaying]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      if (insightOpenTimeRef.current > 0) {
        const duration = Date.now() - insightOpenTimeRef.current;
        trackEvent('insight_read', SLIDES[currentSlide].id, { durationMs: duration });
        insightOpenTimeRef.current = 0;
      }
      setShowInsight(null);
      setDirection('prev');
      const prevIdx = currentSlide - 1;
      setCurrentSlide(prevIdx);
      trackSlideChange(prevIdx, SLIDES[prevIdx].id);
      playPageTurn();
      if (prevIdx === 0 && hasReachedEndRef.current) {
        unlockAchievement('return_visitor');
      }
    }
  }, [currentSlide, setCurrentSlide]);

  // Pick a transition variant based on the current slide index
  const transitionVariant = useMemo(() => {
    const idx = currentSlide % CARD_TRANSITIONS.length;
    const variant = CARD_TRANSITIONS[idx];
    // Reverse direction for prev navigation
    if (direction === 'prev') {
      return {
        initial: { ...variant.exit, opacity: 0 },
        animate: variant.animate,
        exit: { ...variant.initial, opacity: 0 },
        transition: variant.transition,
      };
    }
    return variant;
  }, [currentSlide, direction]);

  const imgVariant = useMemo(() => {
    return IMG_TRANSITIONS[currentSlide % IMG_TRANSITIONS.length];
  }, [currentSlide]);

  const handleDragEnd = (_: never, info: PanInfo) => {
    const direction = info.offset.x < -80 ? 'next' : info.offset.x > 80 ? 'prev' : null;
    if (direction) {
      trackEvent('slide_swipe', SLIDES[currentSlide].id, {
        direction,
        velocity: Math.abs(info.offset.x),
        fromSlide: currentSlide,
        toSlide: direction === 'next' ? currentSlide + 1 : currentSlide - 1,
      });
      playPageTurn();
      if (direction === 'next') goNext();
      else goPrev();
    }
  };

  // Track dwell time for slow_reader achievement
  const slideEnterTimeRef = useRef(Date.now());
  useEffect(() => {
    slideEnterTimeRef.current = Date.now();
    return () => {
      const duration = Date.now() - slideEnterTimeRef.current;
      if (duration > 15000) {
        unlockAchievement('slow_reader');
      }
    };
  }, [currentSlide]);

  // Autoplay logic — pause when insight overlay is open
  useEffect(() => {
    if (isAutoPlaying && showInsight === null) {
      setAutoplayKey(k => k + 1);
      autoplayTimerRef.current = setInterval(() => {
        goNext();
        setAutoplayKey(k => k + 1);
      }, AUTOPLAY_INTERVAL);
    } else {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    }
    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [isAutoPlaying, goNext, showInsight]);

  const toggleAutoPlay = () => {
    const v = !isAutoPlaying;
    setIsAutoPlaying(v);
    trackEvent(v ? 'autoplay_start' : 'autoplay_stop', SLIDES[currentSlide].id, {
      currentSlide,
      totalSlidesViewed: useAppStore.getState().slidesViewed.size,
    });
  };

  const handleReaction = (slideId: number, type: string, emoji: string) => {
    // Submit to backend (also adds to local reactions optimistically)
    submitReaction(slideId, type);
    const currentUserReactions = reactions[slideId] || [];
    trackEvent('reaction_detail', slideId, {
      type,
      emoji,
      slideId,
      userReactionCount: currentUserReactions.length + 1,
    });
    emojiCounter.current += 1;
    const newEmoji = { id: emojiCounter.current, emoji, x: Math.random() * 60 - 30 };
    setFloatingEmojis(prev => [...prev, newEmoji]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 1200);
    playReaction(type);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleShare = (slideId: number) => {
    setShareSlideId(slideId);
    setShowShareModal(true);
    trackShare(slideId, 'open');
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') {
        if (insightOpenTimeRef.current > 0) {
          const duration = Date.now() - insightOpenTimeRef.current;
          trackEvent('insight_read', SLIDES[currentSlide].id, { durationMs: duration });
          insightOpenTimeRef.current = 0;
        }
        setShowInsight(null);
      }
      if (e.key === ' ') { e.preventDefault(); toggleAutoPlay(); }
      trackEvent('keyboard_nav', SLIDES[currentSlide].id, { key: e.key });
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, isAutoPlaying]);

  if (!slide) return null;

  const progress = ((currentSlide + 1) / SLIDES.length) * 100;
  const userReactions = reactions[slide.id] || [];
  const slideCounts = backendCounts[slide.id] || {};

  return (
    <div className="fixed inset-0 flex flex-col bg-james-dark" ref={containerRef}>
      {/* Torn Paper SVG Filter */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="torn-paper-filter" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Hermès Top Bar */}
      <div className="relative z-20 px-5 pt-[env(safe-area-inset-top,8px)] pb-1">
        <div className="flex items-center justify-between mt-2 mb-2">
          <motion.div
            key={actName}
            initial={{ x: -15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3"
          >
            <span className="text-lg">{actEmoji}</span>
            <span className="text-sm text-warm-gold/70 tracking-[4px] uppercase px-4 py-1.5 hermes-border rounded-none">
              {actName}
            </span>
          </motion.div>
          <span className="text-xs text-warm-light/30 tracking-[3px] font-mono">
            {String(currentSlide + 1).padStart(2, '0')} — {SLIDES.length}
          </span>
        </div>
        {/* Elegant Progress Line */}
        <div className="h-[0.5px] bg-white/[0.04] overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-james-orange/60 to-warm-gold/40"
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 25 }}
          />
        </div>
      </div>

      {/* Card Area */}
      <div className="flex-1 flex items-center justify-center px-3 py-1 relative overflow-hidden perspective-container">
        {/* Floating reaction emojis */}
        <AnimatePresence>
          {floatingEmojis.map(e => (
            <motion.div
              key={e.id}
              className="absolute bottom-32 text-3xl pointer-events-none z-50"
              style={{ left: `calc(50% + ${e.x}px)` }}
              initial={{ scale: 0, y: 0, opacity: 1 }}
              animate={{ scale: 1.3, y: -120, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              {e.emoji}
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="w-full max-w-[540px] cursor-grab active:cursor-grabbing"
            style={{ x, rotate, opacity, perspective: 1200 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={handleDragEnd}
            initial={transitionVariant.initial}
            animate={transitionVariant.animate}
            exit={transitionVariant.exit}
            transition={transitionVariant.transition}
          >
            <div className="bg-cream rounded-2xl card-shadow overflow-hidden relative torn-paper">
              {/* Hermès-style thin gold line at top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-[0.5px] bg-gradient-to-r from-transparent via-warm-gold/30 to-transparent z-10" />

              {/* Image */}
              <div className="relative bg-gradient-to-b from-[#F7F3EE] to-[#F0EBE3] aspect-[4/3.5] flex items-center justify-center overflow-hidden">
                <motion.img
                  key={slide.img}
                  src={slide.img}
                  alt={`作品 ${slide.id}`}
                  className="w-full h-full object-contain p-5"
                  initial={imgVariant.initial}
                  animate={imgVariant.animate}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />

                {/* Favorite button */}
                <motion.button
                  className="absolute top-5 right-5 w-9 h-9 rounded-full bg-black/15 backdrop-blur-md flex items-center justify-center z-10"
                  whileTap={{ scale: 0.85 }}
                  onClick={() => {
                    trackEvent('favorite_toggle', slide.id, {
                      action: favorites.includes(slide.id) ? 'remove' : 'add',
                      totalFavorites: favorites.length + (favorites.includes(slide.id) ? -1 : 1),
                    });
                    toggleFavorite(slide.id);
                  }}
                >
                  <span className={`text-lg ${favorites.includes(slide.id) ? '' : 'grayscale opacity-50'}`}>
                    {favorites.includes(slide.id) ? '❤️' : '🤍'}
                  </span>
                </motion.button>

                {/* Insight overlay */}
                <AnimatePresence>
                  {showInsight === slide.id && (
                    <motion.div
                      className="absolute inset-0 insight-glass flex items-center justify-center p-10 z-20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowInsight(null)}
                    >
                      <div className="text-center">
                        <div className="hermes-divider mb-5" />
                        <p className="text-[10px] text-warm-gold/60 tracking-[6px] mb-5 uppercase">{lang === 'sc' ? '解 画' : '解 畫'}</p>
                        <p className="text-lg leading-[2] text-cream/85 tracking-wide">
                          {slide.insight[lang]}
                        </p>
                        <div className="hermes-divider mt-6" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Insight button */}
              <div className="flex justify-center -mt-5 relative z-30">
                <motion.button
                  className="px-10 py-3 bg-james-orange text-white text-sm tracking-[3px] uppercase rounded-full shadow-lg shadow-james-orange/20 relative overflow-hidden"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const isOpening = showInsight !== slide.id;
                    setShowInsight(isOpening ? slide.id : null);
                    if (isOpening) {
                      insightOpenTimeRef.current = Date.now();
                      trackInsight(slide.id, 'open');
                    } else {
                      const duration = Date.now() - insightOpenTimeRef.current;
                      trackEvent('insight_read', slide.id, { durationMs: duration });
                      trackInsight(slide.id, 'close');
                    }
                  }}
                >
                  <span className="relative z-10">
                    {showInsight === slide.id ? '← 返回' : (lang === 'sc' ? '👉🏻 解画' : '👉🏻 解畫')}
                  </span>
                </motion.button>
              </div>

              {/* Caption */}
              <div className="px-7 pt-5 pb-6">
                <p className="text-lg md:text-xl leading-[2] text-[#5A5248] text-center tracking-wide">
                  {slide.caption[lang]}
                </p>
              </div>
            </div>

            {/* Emotion Spectrum Vote */}
            <EmotionVoteBar slideId={slide.id} lang={lang} />

            {/* Reactions Bar — 3 emojis: ❤️ 紅心, 👍 Like, 📤 分享 */}
            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
              {REACTION_TYPES.map(r => {
                // Base count (seed data) + real DB count = total display
                const baseCount = slide.reactions[r.key as keyof typeof slide.reactions] || 0;
                const dbCount = slideCounts[r.key] || 0;
                const userCount = userReactions.filter(ur => ur === r.key).length;
                // Always show base + DB count; add pending local clicks before server responds
                const pendingClicks = dbCount > 0 ? 0 : userCount; // once server responds, dbCount includes our clicks
                const displayCount = baseCount + dbCount + pendingClicks;
                const isActive = userCount > 0;
                const isShareType = r.key === 'share';
                return (
                  <motion.button
                    key={r.key}
                    className={`reaction-btn ${isActive ? 'active' : ''}`}
                    style={isShareType ? { background: 'rgba(232, 98, 26, 0.06)', borderColor: 'rgba(232, 98, 26, 0.15)' } : undefined}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      handleReaction(slide.id, r.key, r.emoji);
                      // Also open share modal for share reaction
                      if (isShareType) {
                        handleShare(slide.id);
                      }
                    }}
                  >
                    <span className="text-lg">{r.emoji}</span>
                    <span className={`text-xs ${isShareType ? 'text-james-orange/60' : 'opacity-50'}`}>
                      {formatCount(displayCount)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hermès Bottom Controls */}
      <div className="relative z-20 px-6 pb-[env(safe-area-inset-bottom,12px)] pt-1">
        {/* Thin separator */}
        <div className="hermes-divider mb-3" style={{ width: '100%', background: 'rgba(255,255,255,0.03)' }} />

        <div className="flex items-center justify-center gap-5">
          {/* Prev button */}
          <motion.button
            className="w-13 h-13 rounded-full flex items-center justify-center text-white bg-james-orange/80 border border-james-orange/30 shadow-md shadow-james-orange/15 transition-all duration-300 hover:bg-james-orange"
            whileTap={{ scale: 0.9 }}
            onClick={goPrev}
            style={{ opacity: currentSlide > 0 ? 1 : 0.25, width: '52px', height: '52px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </motion.button>

          {/* Autoplay button */}
          <motion.button
            className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: isAutoPlaying ? 'rgba(232, 98, 26, 0.15)' : 'rgba(232, 98, 26, 0.06)',
              border: `1.5px solid ${isAutoPlaying ? 'rgba(232, 98, 26, 0.5)' : 'rgba(232, 98, 26, 0.2)'}`,
              width: '56px',
              height: '56px',
            }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleAutoPlay}
          >
            {/* SVG ring progress indicator */}
            {isAutoPlaying && (
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
                <circle
                  key={autoplayKey}
                  cx="24" cy="24" r="18"
                  fill="none"
                  stroke="rgba(232, 98, 26, 0.4)"
                  strokeWidth="0.8"
                  strokeDasharray="113"
                  strokeDashoffset="113"
                  className="autoplay-ring"
                />
              </svg>
            )}
            {isAutoPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-james-orange/70">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-warm-light/40 ml-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </motion.button>

          {/* Next button */}
          <motion.button
            className="w-13 h-13 rounded-full flex items-center justify-center text-white bg-james-orange/80 border border-james-orange/30 shadow-md shadow-james-orange/15 transition-all duration-300 hover:bg-james-orange"
            whileTap={{ scale: 0.9 }}
            onClick={goNext}
            style={{ opacity: currentSlide < SLIDES.length - 1 ? 1 : 0.25, width: '52px', height: '52px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </motion.button>
        </div>

        {/* Quiz shortcut at midpoint */}
        {/* Swipe hint */}
        {currentSlide === 0 && (
          <motion.p
            className="text-center text-[10px] text-warm-light/20 mt-2 tracking-[4px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 3, delay: 2, repeat: 2 }}
          >
            ← {lang === 'tc' ? '左右滑動切換' : '左右滑动切换'} →
          </motion.p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Emotion Spectrum Vote Bar
// ============================================================
const EMOTION_OPTIONS = [
  { key: 'warm',  emoji: '❤️', label: ['感動', '感动'] as [string, string], activeClass: 'bg-rose-400/25 border-rose-400/40 text-rose-700' },
  { key: 'cold',  emoji: '😂', label: ['好笑', '好笑'] as [string, string], activeClass: 'bg-amber-400/25 border-amber-400/40 text-amber-700' },
  { key: 'dream', emoji: '🍵', label: ['療癒', '疗愈'] as [string, string], activeClass: 'bg-emerald-400/25 border-emerald-400/40 text-emerald-700' },
  { key: 'dark',  emoji: '💡', label: ['共鳴', '共鸣'] as [string, string], activeClass: 'bg-sky-400/25 border-sky-400/40 text-sky-700' },
];

function EmotionVoteBar({ slideId, lang }: { slideId: number; lang: 'tc' | 'sc' }) {
  const { emotionVotes, submitEmotionVote } = useAppStore();
  const t = (tc: string, sc: string) => lang === 'sc' ? sc : tc;
  const votedEmotion = emotionVotes[slideId];

  return (
    <div className="mt-3 mb-1">
      {votedEmotion ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2 text-xs text-cream/50"
        >
          <span>✨</span>
          <span>{t('你已感受這張作品', '你已感受这张作品')}：</span>
          <span className="text-warm-gold">
            {EMOTION_OPTIONS.find((e) => e.key === votedEmotion)?.emoji}
            {EMOTION_OPTIONS.find((e) => e.key === votedEmotion)?.label[lang === 'sc' ? 1 : 0]}
          </span>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] text-cream/40 tracking-[2px]">{t('這張作品讓你感覺？', '这张作品让你感觉？')}</span>
          <div className="flex items-center gap-2">
            {EMOTION_OPTIONS.map((opt) => (
              <motion.button
                key={opt.key}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border transition-all duration-300 ${
                  'bg-white/5 border-white/10 text-cream/60 hover:bg-white/10 hover:border-white/20'
                }`}
                whileTap={{ scale: 0.9 }}
                onClick={() => submitEmotionVote(slideId, opt.key)}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label[lang === 'sc' ? 1 : 0]}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
