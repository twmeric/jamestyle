import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent, trackEventImmediate } from '../api/reactionsApi';
import { playBubblePop, startAmbient, stopAmbient } from '../utils/soundManager';
import { unlockAchievement } from '../utils/achievements';

// ===== Grain Overlay (Film texture) =====
function GrainOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[60]"
      style={{
        opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

// ===== Corner Decorations (Hermes style L-lines) =====
function CornerDecorations({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Top Left */}
      <motion.div
        className="absolute top-6 left-6 w-8 h-px bg-[#C4956A]/25"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute top-6 left-6 w-px h-8 bg-[#C4956A]/25"
        initial={{ scaleY: 0, originY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Top Right */}
      <motion.div
        className="absolute top-6 right-6 w-8 h-px bg-[#C4956A]/25"
        initial={{ scaleX: 0, originX: 1 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute top-6 right-6 w-px h-8 bg-[#C4956A]/25"
        initial={{ scaleY: 0, originY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Bottom Left */}
      <motion.div
        className="absolute bottom-6 left-6 w-8 h-px bg-[#C4956A]/25"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute bottom-6 left-6 w-px h-8 bg-[#C4956A]/25"
        initial={{ scaleY: 0, originY: 1 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Bottom Right */}
      <motion.div
        className="absolute bottom-6 right-6 w-8 h-px bg-[#C4956A]/25"
        initial={{ scaleX: 0, originX: 1 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute bottom-6 right-6 w-px h-8 bg-[#C4956A]/25"
        initial={{ scaleY: 0, originY: 1 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

// ===== Hermes Divider =====
function HermesDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#C4956A]/40 to-transparent" />
    </div>
  );
}

// ===== Bubble Data =====
interface BubbleData {
  id: number;
  label: string;
  quote: string;
  x: number;
  y: number;
  delay: number;
}

const BUBBLES_TC: BubbleData[] = [
  { id: 1, label: '加班', quote: '人生最痛苦的兩件事：工作和沒工作！', x: 20, y: 26, delay: 0 },
  { id: 2, label: '內卷', quote: '你不可能十全十美，但你能夠獨一無二！', x: 74, y: 30, delay: 0.4 },
  { id: 3, label: '已讀不回', quote: '說話的藝術，就是把「關你屁事」改成「謝謝你的建議」！', x: 48, y: 56, delay: 0.8 },
  { id: 4, label: '年齡焦慮', quote: '人生不過三萬天，何不暢飲醉百年！', x: 16, y: 70, delay: 1.2 },
  { id: 5, label: '比較', quote: '與其在別人的劇本裡客串路人甲，不如在自己的戲中擔當主角！', x: 78, y: 66, delay: 1.6 },
];

const BUBBLES_SC: BubbleData[] = [
  { id: 1, label: '加班', quote: '人生最痛苦的两件事：工作和没工作！', x: 20, y: 26, delay: 0 },
  { id: 2, label: '内卷', quote: '你不可能十全十美，但你能够独一无二！', x: 74, y: 30, delay: 0.4 },
  { id: 3, label: '已读不回', quote: '说话的艺术，就是把「关你屁事」改成「谢谢你的建议」！', x: 48, y: 56, delay: 0.8 },
  { id: 4, label: '年龄焦虑', quote: '人生不过三万天，何不畅饮醉百年！', x: 16, y: 70, delay: 1.2 },
  { id: 5, label: '比较', quote: '与其在别人的剧本里客串路人甲，不如在自己的戏中担当主角！', x: 78, y: 66, delay: 1.6 },
];

// ===== Breathing Lines =====
const BREATHING_LINES_TC = [
  { text: '這裡沒有進度條', delay: 0.5 },
  { text: '沒有已讀不回', delay: 1.8 },
  { text: '沒有人催促你', delay: 3.4 },
  { text: '深呼吸', delay: 5.4, hasDots: true },
];

const BREATHING_LINES_SC = [
  { text: '这里没有进度条', delay: 0.5 },
  { text: '没有已读不回', delay: 1.8 },
  { text: '没有人催促你', delay: 3.4 },
  { text: '深呼吸', delay: 5.4, hasDots: true },
];

// ===== Curated 6 Slides =====
const SLIDES_TC = [
  {
    img: '/images/profile/profile-09.jpeg',
    caption: '人生最痛苦的兩件事：\n工作和沒工作！',
    sub: '— 阿占隨意',
  },
  {
    img: '/images/profile/profile-02.jpeg',
    caption: '生命中有些問題，\n不是要你解決，而是要你放下！',
    sub: '— 阿占隨意',
  },
  {
    img: '/images/profile/profile-05.jpeg',
    caption: '像金魚一樣，\n把所有不開心的事，只保留七秒鐘的記憶！',
    sub: '— 阿占隨意',
  },
  {
    img: '/images/profile/profile-06.jpeg',
    caption: '你不可能十全十美，\n但你能夠獨一無二！',
    sub: '— 阿占隨意',
  },
  {
    img: '/images/profile/profile-08.jpeg',
    caption: '希望大家都能走出舒適圈，\n讓我進去！',
    sub: '— 阿占隨意',
  },
  {
    img: '/images/profile/profile-04.jpeg',
    caption: '不用強裝作堅強，\n偶爾像個孩子也很好！',
    sub: '— 阿占隨意',
  },
];

const SLIDES_SC = [
  {
    img: '/images/profile/profile-09.jpeg',
    caption: '人生最痛苦的两件事：\n工作和没工作！',
    sub: '— 阿占随意',
  },
  {
    img: '/images/profile/profile-02.jpeg',
    caption: '生命中有些问题，\n不是要你解决，而是要你放下！',
    sub: '— 阿占随意',
  },
  {
    img: '/images/profile/profile-05.jpeg',
    caption: '像金鱼一样，\n把所有不开心的事，只保留七秒钟的记忆！',
    sub: '— 阿占随意',
  },
  {
    img: '/images/profile/profile-06.jpeg',
    caption: '你不可能十全十美，\n但你能够独一无二！',
    sub: '— 阿占随意',
  },
  {
    img: '/images/profile/profile-08.jpeg',
    caption: '希望大家都能走出舒适圈，\n让我进去！',
    sub: '— 阿占随意',
  },
  {
    img: '/images/profile/profile-04.jpeg',
    caption: '不用强装作坚强，\n偶尔像个孩子也很好！',
    sub: '— 阿占随意',
  },
];

// ===== Particle Burst =====
function PopParticles({ x, y }: { x: number; y: number }) {
  const particles = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2;
    const dist = 25 + Math.random() * 30;
    return { id: i, tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist };
  });

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 rounded-full bg-[#C4956A]"
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.tx, y: p.ty, opacity: 0, scale: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  );
}

// ===== Main Component =====
export default function HealingIntro({ onComplete }: { onComplete: () => void }) {
  const { lang } = useAppStore();

  const bubbles = useMemo(() => (lang === 'sc' ? BUBBLES_SC : BUBBLES_TC), [lang]);
  const breathingLines = useMemo(() => (lang === 'sc' ? BREATHING_LINES_SC : BREATHING_LINES_TC), [lang]);
  const slides = useMemo(() => (lang === 'sc' ? SLIDES_SC : SLIDES_TC), [lang]);

  const [phase, setPhase] = useState<'breathing' | 'bubbles' | 'digest' | 'slideshow' | 'complete' | 'exiting'>('breathing');
  const [poppedBubbles, setPoppedBubbles] = useState<Set<number>>(new Set());
  const [digestSubPhase, setDigestSubPhase] = useState<'quote' | 'ready'>('quote');
  const [centerQuote, setCenterQuote] = useState<string | null>(null);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [breathingDots, setBreathingDots] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const quoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubblesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    if (quoteTimerRef.current) {
      clearTimeout(quoteTimerRef.current);
      quoteTimerRef.current = null;
    }
    if (bubblesTimeoutRef.current) {
      clearTimeout(bubblesTimeoutRef.current);
      bubblesTimeoutRef.current = null;
    }
  }, []);

  const startBubblesTimeout = useCallback(() => {
    if (bubblesTimeoutRef.current) clearTimeout(bubblesTimeoutRef.current);
    bubblesTimeoutRef.current = setTimeout(() => {
      if (quoteTimerRef.current) {
        clearTimeout(quoteTimerRef.current);
        quoteTimerRef.current = null;
      }
      setPoppedBubbles(new Set(bubbles.map((b) => b.id)));
      bubbles.forEach((b) => {
        trackEventImmediate('bubble_popped', undefined, {
          bubbleId: b.id,
          label: b.label,
          isAuto: true,
          totalPopped: bubbles.length,
        });
      });
      setCenterQuote(lang === 'sc' ? '放下，其实比抓住更需要勇气' : '放下，其實比抓住更需要勇氣');
      setPhase('digest');
    }, 7000);
  }, [bubbles, lang]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  // Breathing → bubbles at ~8.5s
  useEffect(() => {
    const t1 = setTimeout(() => {
      trackEvent('opening_breathing_complete');
      setPhase('bubbles');
    }, 8500);
    timerRef.current.push(t1);
    return () => clearTimers();
  }, [clearTimers]);

  // Ambient sound — starts on breathing, stops after slideshow
  useEffect(() => {
    if (phase === 'breathing') {
      startAmbient('breathing');
    } else if (phase === 'slideshow' || phase === 'complete' || phase === 'exiting') {
      stopAmbient();
    }
  }, [phase]);

  // Breathing typewriter dots for last line
  useEffect(() => {
    if (phase !== 'breathing') return;
    setBreathingDots(0);
    const startTyping = setTimeout(() => {
      let count = 0;
      const timer = setInterval(() => {
        count++;
        setBreathingDots(count);
        if (count >= 6) clearInterval(timer);
      }, 200);
    }, 6200); // line delay (5.4) + entrance animation (~0.8)
    return () => {
      clearTimeout(startTyping);
      setBreathingDots(0);
    };
  }, [phase]);

  // Bubbles: 7s timeout → auto-pop all → digest
  useEffect(() => {
    if (phase !== 'bubbles') return;
    startBubblesTimeout();
    return () => {
      if (bubblesTimeoutRef.current) clearTimeout(bubblesTimeoutRef.current);
    };
  }, [phase, startBubblesTimeout]);

  // All popped → wait for quote to be read (4s) → digest
  useEffect(() => {
    if (phase !== 'bubbles') return;
    if (poppedBubbles.size === bubbles.length) {
      if (bubblesTimeoutRef.current) {
        clearTimeout(bubblesTimeoutRef.current);
        bubblesTimeoutRef.current = null;
      }
      if (quoteTimerRef.current) {
        clearTimeout(quoteTimerRef.current);
        quoteTimerRef.current = null;
      }
      const t = setTimeout(() => {
        setCenterQuote(lang === 'sc' ? '放下，其实比抓住更需要勇气' : '放下，其實比抓住更需要勇氣');
        setPhase('digest');
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [bubbles, phase, poppedBubbles]);

  // Digest: 4s quote + 3s ready → slideshow
  useEffect(() => {
    if (phase !== 'digest') return;
    trackEvent('digest_quote_seen');
    setDigestSubPhase('quote');
    const t1 = setTimeout(() => {
      trackEvent('digest_ready_seen');
      setDigestSubPhase('ready');
    }, 4000);
    const t2 = setTimeout(() => {
      setCenterQuote(null);
      setDigestSubPhase('quote');
      setPhase('slideshow');
    }, 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  // Slideshow end → complete
  useEffect(() => {
    if (phase !== 'slideshow') return;
    const t = setTimeout(() => setPhase('complete'), 36000); // 6 slides × 6s
    timerRef.current.push(t);
    return () => clearTimers();
  }, [phase, clearTimers]);

  // Complete → exiting → onComplete
  useEffect(() => {
    if (phase !== 'complete') return;
    trackEvent('opening_complete_seen');
    const t = setTimeout(() => {
      setPhase('exiting');
      setTimeout(onComplete, 1000);
    }, 3000);
    timerRef.current.push(t);
    return () => clearTimers();
  }, [phase, onComplete, clearTimers]);

  // Slideshow interval
  useEffect(() => {
    if (phase !== 'slideshow') return;
    const interval = setInterval(() => {
      setCurrentSlideIdx((prev) => {
        if (prev >= slides.length - 1) return prev;
        return prev + 1;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [phase, slides]);

  // Slideshow slide view tracking
  useEffect(() => {
    if (phase !== 'slideshow') return;
    trackEvent('slideshow_slide_view', undefined, {
      slideIndex: currentSlideIdx,
      slideImage: slides[currentSlideIdx].img,
    });
  }, [phase, currentSlideIdx, slides]);

  const popBubble = useCallback((bubble: BubbleData) => {
    if (poppedBubbles.has(bubble.id)) return;
    playBubblePop();
    const newSize = poppedBubbles.size + 1;
    setPoppedBubbles((prev) => new Set([...prev, bubble.id]));
    if (newSize === bubbles.length) {
      unlockAchievement('bubble_popper');
    }
    trackEventImmediate('bubble_popped', undefined, {
      bubbleId: bubble.id,
      label: bubble.label,
      quote: bubble.quote,
      isAuto: false,
      totalPopped: newSize,
    });
    setCenterQuote(bubble.quote);
    // Reset bubbles timeout on each pop (gives user time to read)
    startBubblesTimeout();
    // Auto-clear bubble quote after 4s (only if not all popped)
    if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current);
    quoteTimerRef.current = setTimeout(() => {
      trackEvent('bubble_quote_read', undefined, {
        quote: bubble.quote,
        bubbleId: bubble.id,
      });
      setCenterQuote(null);
      quoteTimerRef.current = null;
    }, 4000);
  }, [poppedBubbles, startBubblesTimeout]);

  const skipAll = useCallback(() => {
    trackEventImmediate('opening_skip', undefined, { skippedAt: phase });
    clearTimers();
    setPoppedBubbles(new Set(bubbles.map((b) => b.id)));
    setCenterQuote(null);
    setPhase('slideshow');
    setCurrentSlideIdx(slides.length - 1);
    setTimeout(() => setPhase('complete'), 600);
    setTimeout(() => {
      setPhase('exiting');
      setTimeout(onComplete, 1000);
    }, 3000);
  }, [bubbles, clearTimers, onComplete, phase, slides]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0D0B09] font-naikai">
      <GrainOverlay />

      {/* ===== BREATHING PHASE (5s) ===== */}
      <AnimatePresence>
        {phase === 'breathing' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <CornerDecorations />

            {/* Outer glow ring */}
            <motion.div
              className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full border border-[#C4956A]/10"
              animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.05, 0.15] }}
              transition={{ duration: 8.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-48 h-48 md:w-60 md:h-60 rounded-full bg-[#C4956A]/5"
              animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.06, 0.2] }}
              transition={{ duration: 8.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-3 h-3 rounded-full bg-[#C4956A]/60"
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.3, 0.6] }}
              transition={{ duration: 8.4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Lines */}
            <div className="relative z-10 text-center mt-28 md:mt-32 space-y-6">
              {breathingLines.map((line) => (
                <motion.p
                  key={line.text}
                  className="text-[#C4956A]/80 text-3xl md:text-4xl tracking-[6px]"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ delay: line.delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  {line.text}
                  {(line as any).hasDots && (
                    <span className="inline-block min-w-[2.5em] text-left">
                      {'.'.repeat(breathingDots)}
                    </span>
                  )}
                </motion.p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== BUBBLES PHASE ===== */}
      <AnimatePresence>
        {(phase === 'bubbles' || phase === 'digest') && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <CornerDecorations />

            {/* Top hint */}
            <motion.div
              className="absolute top-[12%] left-0 right-0 text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <p className="text-[#B8A88A]/60 text-base tracking-[6px]">{lang === 'sc' ? '点击释放你的烦恼' : '點擊釋放你的煩惱'}</p>
              <div className="flex justify-center mt-3 gap-2">
                {bubbles.map((b) => (
                  <div
                    key={b.id}
                    className={`w-8 h-[3px] rounded-full transition-colors duration-500 ${
                      poppedBubbles.has(b.id) ? 'bg-[#C4956A]' : 'bg-[#C4956A]/20'
                    }`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Bubbles */}
            {bubbles.map((bubble) => {
              const isPopped = poppedBubbles.has(bubble.id);
              // Random drift path for each bubble — organic floating motion
              const driftX = (Math.random() - 0.5) * 80;
              const driftY = (Math.random() - 0.5) * 60;
              const driftX2 = (Math.random() - 0.5) * 60;
              const driftY2 = (Math.random() - 0.5) * 80;
              const duration = 4 + Math.random() * 3;
              return (
                <AnimatePresence key={bubble.id}>
                  {!isPopped && (
                    <motion.button
                      className="absolute flex items-center justify-center rounded-full cursor-pointer"
                      style={{
                        left: `${bubble.x}%`,
                        top: `${bubble.y}%`,
                        width: 100,
                        height: 100,
                        transform: 'translate(-50%, -50%)',
                        backgroundImage: 'url(/images/bubble.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.45)) drop-shadow(0 0 6px rgba(180,220,255,0.35))',
                        WebkitFilter: 'drop-shadow(0 0 16px rgba(255,255,255,0.45)) drop-shadow(0 0 6px rgba(180,220,255,0.35))',
                      }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x: [0, driftX, driftX2, 0],
                        y: [0, driftY, driftY2, 0],
                      }}
                      exit={{ opacity: 0, scale: 1.4 }}
                      transition={{
                        opacity: { delay: bubble.delay, duration: 0.6 },
                        scale: { delay: bubble.delay, duration: 0.6, type: 'spring', stiffness: 120 },
                        x: { delay: bubble.delay + 0.3, duration, repeat: Infinity, ease: 'easeInOut' },
                        y: { delay: bubble.delay + 0.3, duration: duration * 1.15, repeat: Infinity, ease: 'easeInOut' },
                      }}
                      onClick={() => popBubble(bubble)}
                    >
                      <span className="text-[#1a1a2e] text-base font-bold tracking-wider drop-shadow-sm">{bubble.label}</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              );
            })}

            {/* Particles */}
            {bubbles.filter((b) => poppedBubbles.has(b.id)).map((b) => (
              <PopParticles key={`p-${b.id}`} x={b.x} y={b.y} />
            ))}

            {/* Bubble Quote — shown when a bubble is popped during bubbles phase */}
            <AnimatePresence>
              {phase === 'bubbles' && centerQuote && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center px-8 pointer-events-none"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="max-w-[400px] text-center">
                    <HermesDivider className="max-w-[120px] mx-auto mb-6" />
                    <p className="text-[#F7F3EE] text-xl md:text-2xl leading-relaxed font-medium tracking-wide">
                      {centerQuote}
                    </p>
                    <HermesDivider className="max-w-[120px] mx-auto mt-6" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Center Quote / Transition -- Digest Phase */}
            <AnimatePresence mode="wait">
              {phase === 'digest' && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center px-8 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="max-w-[400px] text-center">
                    <HermesDivider className="max-w-[120px] mx-auto mb-6" />
                    <AnimatePresence mode="wait">
                      {digestSubPhase === 'quote' ? (
                        <motion.p
                          key="quote"
                          className="text-[#F7F3EE] text-xl md:text-2xl leading-relaxed font-medium tracking-wide"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.5 }}
                        >
                          {lang === 'sc' ? '放下，其实比抓住更需要勇气' : '放下，其實比抓住更需要勇氣'}
                        </motion.p>
                      ) : (
                        <motion.p
                          key="ready"
                          className="text-[#C4956A] text-lg md:text-xl tracking-[4px]"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.5 }}
                        >
                          {lang === 'sc' ? '准备好了，我们开始' : '準備好了，我們開始'}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <HermesDivider className="max-w-[120px] mx-auto mt-6" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Skip */}
            <button
              className="absolute bottom-8 right-6 text-[#C4956A]/30 text-sm tracking-wider hover:text-[#C4956A]/70 transition-colors duration-300 cursor-pointer"
              onClick={skipAll}
            >
              {lang === 'sc' ? '跳过' : '跳過'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SLIDESHOW PHASE (36s, 6 slides × 6s) ===== */}
      <AnimatePresence>
        {phase === 'slideshow' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <CornerDecorations />

            {/* Image area */}
            <div className="relative w-full max-w-[420px] md:max-w-[480px] aspect-square flex items-center justify-center">
              <AnimatePresence mode="wait">
                {slides.map((slide, idx) =>
                  idx === currentSlideIdx ? (
                    <motion.div
                      key={idx}
                      className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl"
                      initial={{ opacity: 0, clipPath: 'circle(0% at 50% 50%)' }}
                      animate={{ opacity: 1, clipPath: 'circle(150% at 50% 50%)' }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <img
                        src={slide.img}
                        alt=""
                        className="w-full h-full object-contain"
                        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
                      />
                    </motion.div>
                  ) : null
                )}
              </AnimatePresence>
            </div>

            {/* Text area */}
            <div className="relative mt-8 md:mt-10 text-center max-w-[480px]">
              <AnimatePresence mode="wait">
                {slides.map((slide, idx) =>
                  idx === currentSlideIdx ? (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className="text-[#F7F3EE] text-2xl md:text-3xl leading-relaxed font-medium tracking-wide whitespace-pre-line">
                        {slide.caption}
                      </p>
                      <p className="text-[#C4956A]/50 text-sm mt-4 tracking-[6px]">{slide.sub}</p>
                    </motion.div>
                  ) : null
                )}
              </AnimatePresence>
            </div>

            {/* Slide counter dots */}
            <div className="absolute bottom-10 flex gap-2.5">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-[2px] rounded-full transition-all duration-700 ${
                    idx === currentSlideIdx
                      ? 'w-8 bg-[#C4956A]'
                      : idx < currentSlideIdx
                      ? 'w-2 bg-[#C4956A]/40'
                      : 'w-2 bg-[#C4956A]/15'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== COMPLETE PHASE (3s) ===== */}
      <AnimatePresence>
        {phase === 'complete' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D0B09]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <CornerDecorations />

            <motion.img
              src="/images/profile/profile-04.jpeg"
              alt="阿占"
              className="w-36 h-36 md:w-44 md:h-44 rounded-full object-cover"
              style={{ boxShadow: '0 16px 60px rgba(196, 149, 106, 0.15)' }}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.2 }}
            />

            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <HermesDivider className="max-w-[100px] mx-auto mb-6" />
              <p className="text-[#F7F3EE] text-3xl md:text-4xl tracking-wider font-medium">
                {lang === 'sc' ? '放下啦嘛！？' : '放下啦嘛！？'}
              </p>
              <p className="text-[#C4956A] text-xl md:text-2xl tracking-[4px] mt-4">
                {lang === 'sc' ? '我们出发' : '我哋出發'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
