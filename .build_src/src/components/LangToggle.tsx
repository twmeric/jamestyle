import { useAppStore } from '../store/appStore';
import { motion } from 'framer-motion';
import { unlockAchievement } from '../utils/achievements';

export default function LangToggle() {
  const { lang, setLang, soundEnabled, toggleSound } = useAppStore();

  return (
    <motion.div
      className="fixed top-3 right-3 z-[60] flex items-center bg-white/[0.03] backdrop-blur-xl p-0.5 rounded-lg"
      style={{ border: '0.5px solid rgba(255, 255, 255, 0.06)' }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      {/* Sound Toggle */}
      <button
        className="w-9 h-9 flex items-center justify-center rounded-md transition-all duration-300 hover:bg-white/5"
        onClick={() => {
          const newState = toggleSound();
          if (newState) unlockAchievement('sound_on');
        }}
        title={soundEnabled ? '關閉聲音' : '開啟聲音'}
      >
        <span className="text-sm">{soundEnabled ? '🔊' : '🔇'}</span>
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-white/10 mx-0.5" />

      {/* Lang Toggle */}
      {(['tc', 'sc'] as const).map((l) => (
        <button
          key={l}
          className={`px-3 py-2 text-xs tracking-[2px] rounded-md transition-all duration-300 ${
            lang === l
              ? 'bg-warm-gold/90 text-white'
              : 'text-warm-light/35 hover:text-warm-light/60'
          }`}
          onClick={() => setLang(l)}
        >
          {l === 'tc' ? '繁體' : '简体'}
        </button>
      ))}
    </motion.div>
  );
}
