import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo, type Transition } from 'framer-motion';
import { SLIDES, ACT_NAMES, ACT_EMOJIS } from '../data/slides';
import { useAppStore } from '../store/appStore';
import { trackEvent, trackEventImmediate } from '../api/reactionsApi';
import { playReaction } from '../utils/soundManager';
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
];

// ===== Gallery Frame Styles by Act — 4 distinct museum frame aesthetics =====
const FRAME_CLASSES = [
  /* 0: 扎心共鳴 — Bold Modern Black */
  'border-[#1a1a1a] border-[5px] rounded-none shadow-[4px_4px_0_0_#1a1a1a,8px_8px_20px_rgba(0,0,0,0.12)]',
  /* 1: 溫柔療癒 — Warm Wood */
  'border-[#A67C52] border-[6px] rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.3),3px_3px_0_0_#8B6239,6px_6px_24px_rgba(139,98,57,0.15)]',
  /* 2: 人生態度 — Fine Metallic Gold */
  'border-[#C4956A] border-[1.5px] rounded-sm shadow-[0_0_0_3px_#F5F2ED,0_0_0_4.5px_#C4956A,0_12px_32px_rgba(196,149,106,0.15)]',
  /* 3: 品牌個性 — Double-layer Shadow Box */
  'border-[#2a2a2a] border-[3px] rounded-none shadow-[inset_0_2px_8px_rgba(0,0,0,0.06),4px_4px_0_0_#fff,5px_5px_0_0_#2a2a2a,10px_10px_30px_rgba(0,0,0,0.1)]',
];

// Frame inner matte color per act
const MATTE_CLASSES = [
  'bg-white',
  'bg-[#FDFBF7]',
  'bg-white',
  'bg-[#FAFAFA]',
];

const AUTOPLAY_INTERVAL = 5000;

function formatCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export default function CardGallery() {
  const { lang, currentSlide, setCurrentSlide, reactions, backendCounts, submitReaction, loadReactions, setPhase, isAutoPlaying, setIsAutoPlaying, trackSlideChange, trackInsight, trackShare, emotionVotes, submitEmotionVote } = useAppStore();
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

  const BG_IMAGES = [
    '/images/bg_act0.jpg',
    '/images/bg_act1.jpg',
    '/images/bg_act2.jpg',
    '/images/bg_act3.jpg',
  ];

  return (
    <div className="min-h-[100dvh] w-full flex flex-col relative" ref={containerRef}>
      {/* Act-specific Gallery Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.act}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={BG_IMAGES[slide.act]}
            alt=""
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gallery Top Bar */}
      <div className="relative z-20 px-4 sm:px-5 pt-[env(safe-area-inset-top,6px)] pb-1 shrink-0">
        <div className="flex items-center justify-between mt-1.5 sm:mt-2 mb-1.5 sm:mb-2">
          <motion.div
            key={actName}
            initial={{ x: -15, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2 sm:gap-3"
          >
            <span className="text-base sm:text-lg">{actEmoji}</span>
            <span className="text-xs sm:text-sm text-[#5A5248] tracking-[3px] sm:tracking-[4px] uppercase px-2.5 sm:px-4 py-1 sm:py-1.5 border border-[#5A5248]/30 rounded-none">
              {actName}
            </span>
          </motion.div>

        </div>
        {/* Elegant Progress Line */}
        <div className="h-[0.5px] bg-black/[0.06] overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#E8621A]/60 to-[#C4956A]/40"
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 25 }}
          />
        </div>
      </div>

      {/* Card Area */}
      <div className="flex-1 flex items-center justify-center px-2 sm:px-3 py-0.5 sm:py-1 relative z-10 perspective-container">
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
            <div className={`overflow-hidden ${FRAME_CLASSES[slide.act]} ${MATTE_CLASSES[slide.act]}`}>
              {/* Image */}
              <div className={`relative aspect-[4/3.5] flex items-center justify-center overflow-hidden ${MATTE_CLASSES[slide.act]}`}>
                <motion.img
                  key={slide.img}
                  src={slide.img}
                  alt={`作品 ${slide.id}`}
                  className="w-full h-full object-contain p-4 sm:p-5"
                  initial={imgVariant.initial}
                  animate={imgVariant.animate}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />

                {/* Insight overlay */}
                <AnimatePresence>
                  {showInsight === slide.id && (
                    <motion.div
                      className="absolute inset-0 bg-[#F5F2ED]/95 backdrop-blur-sm flex items-center justify-center p-6 sm:p-10 z-20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowInsight(null)}
                    >
                      <div className="text-center">
                        <div className="w-8 h-[1px] bg-[#C4956A]/40 mx-auto mb-5" />
                        <p className="text-[10px] text-[#C4956A]/70 tracking-[6px] mb-5 uppercase">{lang === 'sc' ? '解 画' : '解 畫'}</p>
                        <p className="text-base sm:text-lg leading-[2] text-[#4A4A4A]/85 tracking-wide">
                          {slide.insight[lang]}
                        </p>
                        <div className="w-8 h-[1px] bg-[#C4956A]/40 mx-auto mt-6" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Insight button */}
              <div className="flex justify-center -mt-4 sm:-mt-5 relative z-30">
                <motion.button
                  className="px-8 sm:px-10 py-2.5 sm:py-3 bg-[#E8621A] text-white text-xs sm:text-sm tracking-[3px] uppercase rounded-full shadow-lg shadow-[#E8621A]/20 relative overflow-hidden"
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
              <div className="px-5 sm:px-7 pt-4 sm:pt-5 pb-3 sm:pb-4">
                <p className="text-base sm:text-lg md:text-xl leading-[2] text-[#5A5248] text-center tracking-wide">
                  {slide.caption[lang]}
                </p>
              </div>

              {/* Exhibition Plaque — artwork title */}
              <div className="text-center pb-4 sm:pb-5">
                <span className="text-xs sm:text-sm text-[#E8621A] font-bold tracking-[2px] sm:tracking-[3px]">
                  【{slide.title[lang]}】
                </span>
              </div>
            </div>

            {/* Emotion Spectrum Vote */}
            <EmotionVoteBar slideId={slide.id} lang={lang} />

            {/* Reactions Bar — 2 emojis: ❤️ 紅心, 👍 Like */}
            <div className="flex items-center justify-center gap-3 mt-3 sm:mt-4 flex-wrap">
              {REACTION_TYPES.map(r => {
                // Base count (seed data) + real DB count = total display
                const baseCount = slide.reactions[r.key as keyof typeof slide.reactions] || 0;
                const dbCount = slideCounts[r.key] || 0;
                const userCount = userReactions.filter(ur => ur === r.key).length;
                // Always show base + DB count; add pending local clicks before server responds
                const pendingClicks = dbCount > 0 ? 0 : userCount; // once server responds, dbCount includes our clicks
                const displayCount = baseCount + dbCount + pendingClicks;
                const isActive = userCount > 0;
                return (
                  <motion.button
                    key={r.key}
                    className={`reaction-btn-light ${isActive ? 'active' : ''}`}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleReaction(slide.id, r.key, r.emoji)}
                  >
                    <span className="text-lg">{r.emoji}</span>
                    <span className="text-xs opacity-50">
                      {formatCount(displayCount)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-20 px-4 sm:px-6 pb-[env(safe-area-inset-bottom,12px)] pt-1 shrink-0">
        {/* Thin separator */}
        <div className="w-full h-[1px] bg-black/[0.06] mb-3" />

        <div className="flex items-center justify-center gap-4 sm:gap-5">
          {/* Prev button */}
          <motion.button
            className="w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center text-white bg-[#2a2a2a]/90 border border-[#2a2a2a]/30 shadow-md shadow-black/15 transition-all duration-300 hover:bg-[#1a1a1a]"
            whileTap={{ scale: 0.9 }}
            onClick={goPrev}
            style={{ opacity: currentSlide > 0 ? 1 : 0.25 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </motion.button>

          {/* Autoplay button */}
          <motion.button
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: isAutoPlaying ? 'rgba(42, 42, 42, 0.15)' : 'rgba(42, 42, 42, 0.06)',
              border: `1.5px solid ${isAutoPlaying ? 'rgba(42, 42, 42, 0.5)' : 'rgba(42, 42, 42, 0.2)'}`,
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
                  stroke="rgba(42, 42, 42, 0.4)"
                  strokeWidth="0.8"
                  strokeDasharray="113"
                  strokeDashoffset="113"
                  className="autoplay-ring"
                />
              </svg>
            )}
            {isAutoPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2a2a2a]/70">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-[#2a2a2a]/60 ml-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </motion.button>

          {/* Next button */}
          <motion.button
            className="w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center text-white bg-[#2a2a2a]/90 border border-[#2a2a2a]/30 shadow-md shadow-black/15 transition-all duration-300 hover:bg-[#1a1a1a]"
            whileTap={{ scale: 0.9 }}
            onClick={goNext}
            style={{ opacity: currentSlide < SLIDES.length - 1 ? 1 : 0.25 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </motion.button>
        </div>

        {/* Swipe hint */}
        {currentSlide === 0 && (
          <motion.p
            className="text-center text-[10px] text-gray-400/50 mt-2 tracking-[4px]"
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
          className="flex items-center justify-center gap-2 text-xs text-gray-400"
        >
          <span>✨</span>
          <span>{t('你已感受這張作品', '你已感受这张作品')}：</span>
          <span className="text-[#C4956A]">
            {EMOTION_OPTIONS.find((e) => e.key === votedEmotion)?.emoji}
            {EMOTION_OPTIONS.find((e) => e.key === votedEmotion)?.label[lang === 'sc' ? 1 : 0]}
          </span>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] text-gray-400 tracking-[2px]">{t('這張作品讓你感覺？', '这张作品让你感觉？')}</span>
          <div className="flex items-center gap-2">
            {EMOTION_OPTIONS.map((opt) => (
              <motion.button
                key={opt.key}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border transition-all duration-300 ${
                  'bg-black/[0.03] border-black/[0.08] text-gray-500 hover:bg-black/[0.06] hover:border-black/[0.12]'
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
