import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACHIEVEMENTS, type AchievementDef } from '../utils/achievements';
import { useAppStore } from '../store/appStore';

export default function AchievementToast() {
  const { lang } = useAppStore();
  const [queue, setQueue] = useState<AchievementDef[]>([]);
  const [current, setCurrent] = useState<AchievementDef | null>(null);

  useEffect(() => {
    const handleUnlock = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const ach = ACHIEVEMENTS.find((a) => a.id === detail?.id);
      if (ach) {
        setQueue((prev) => [...prev, ach]);
      }
    };
    window.addEventListener('achievement-unlocked', handleUnlock);
    return () => window.removeEventListener('achievement-unlocked', handleUnlock);
  }, []);

  // Process queue
  useEffect(() => {
    if (current || queue.length === 0) return;
    const next = queue[0];
    setQueue((prev) => prev.slice(1));
    setCurrent(next);
    const t = setTimeout(() => setCurrent(null), 3500);
    return () => clearTimeout(t);
  }, [queue, current]);

  if (!current) return null;

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed top-20 left-6 z-[100] px-5 py-3 rounded-2xl flex items-center gap-3"
          style={{
            background: 'rgba(13, 11, 9, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '0.5px solid rgba(196, 149, 106, 0.25)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          <motion.span
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
            className="text-2xl"
          >
            {current.emoji}
          </motion.span>
          <div className="flex flex-col">
            <span className="text-[10px] text-cream/50 tracking-[2px] uppercase">
              {lang === 'sc' ? '解锁成就' : '解鎖成就'}
            </span>
            <span className="text-sm text-warm-gold font-medium">
              {lang === 'sc' ? current.sc : current.tc}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
