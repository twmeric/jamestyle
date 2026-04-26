import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

export default function Opening() {
  const { setPhase, lang } = useAppStore();
  const [step, setStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1400),
      setTimeout(() => setStep(3), 2500),
      setTimeout(() => {
        setStep(4);
        setTimeout(() => setPhase('gallery'), 900);
      }, 4200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [setPhase]);

  const slogan = lang === 'tc' ? '隨意，但不隨便' : '随意，但不随便';
  const sloganChars = slogan.split('');

  return (
    <AnimatePresence>
      {step < 4 && (
        <motion.div
          ref={containerRef}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-james-dark overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          {/* Subtle floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 2 + 1,
                  height: Math.random() * 2 + 1,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: `rgba(196, 149, 106, ${Math.random() * 0.15 + 0.05})`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.1, 0.4, 0.1],
                }}
                transition={{
                  duration: Math.random() * 4 + 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Logo */}
          <motion.div
            className="relative mb-12"
            initial={{ scale: 0, opacity: 0 }}
            animate={step >= 1 ? { scale: 1, opacity: 1 } : {}}
            transition={{ type: 'spring', damping: 18, stiffness: 80 }}
          >
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-[#FFF9EE] to-[#FFF0D6] flex items-center justify-center shadow-2xl relative">
              <img src="/logo.png" alt="阿占" className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover" />
              <motion.div
                className="absolute inset-[-10px] rounded-full"
                style={{ border: '0.5px solid rgba(196, 149, 106, 0.2)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            {/* Soft glow */}
            <div className="absolute inset-0 rounded-full bg-james-orange/10 blur-[60px] -z-10 scale-[2]" />
          </motion.div>

          {/* Decorative line above slogan */}
          <motion.div
            className="hermes-divider mb-6"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={step >= 2 ? { scaleX: 1, opacity: 1 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Slogan with staggered char animation */}
          <div className="flex gap-0.5 mb-5 overflow-hidden">
            {sloganChars.map((char, i) => (
              <motion.span
                key={i}
                className="text-2xl md:text-3xl text-warm-gold/90 tracking-[8px] inline-block"
                initial={{ y: 50, opacity: 0 }}
                animate={step >= 2 ? { y: 0, opacity: 1 } : {}}
                transition={{ delay: i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                {char === '，' ? <span className="mx-1.5">{char}</span> : char}
              </motion.span>
            ))}
          </div>

          {/* Decorative line below slogan */}
          <motion.div
            className="hermes-divider mb-6"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={step >= 2 ? { scaleX: 1, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Brand */}
          <motion.p
            className="text-warm-light/40 text-[11px] tracking-[6px] uppercase"
            initial={{ opacity: 0 }}
            animate={step >= 3 ? { opacity: 1 } : {}}
            transition={{ duration: 1 }}
          >
            阿占隨意 James Style
          </motion.p>

          {/* Scroll hint */}
          <motion.div
            className="absolute bottom-14 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={step >= 3 ? { opacity: 0.35 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <motion.div
              className="w-4 h-7 rounded-full flex items-start justify-center p-1.5"
              style={{ border: '0.5px solid rgba(196, 149, 106, 0.25)' }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <motion.div
                className="w-0.5 h-1.5 bg-warm-gold/40 rounded-full"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
