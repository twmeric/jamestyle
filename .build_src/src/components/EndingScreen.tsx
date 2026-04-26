import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import CollageGenerator from './CollageGenerator';

export default function EndingScreen() {
  const { lang, setPhase, setCurrentSlide, favorites } = useAppStore();
  const [showCollage, setShowCollage] = useState(false);

  const handleReplay = () => {
    setCurrentSlide(0);
    setPhase('gallery');
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/85268810677', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-james-dark overflow-y-auto px-8 py-10">
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-james-orange/[0.04] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-warm-gold/[0.04] rounded-full blur-[120px]" />
      </div>

      <motion.div
        className="relative text-center max-w-sm mx-auto min-h-[100dvh] flex flex-col justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Avatar */}
        <motion.div
          className="mx-auto mb-10 w-24 h-24 rounded-full bg-gradient-to-br from-[#FFF9EE] to-[#FFF0D6] flex items-center justify-center shadow-xl relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.3, damping: 15 }}
        >
          <img src="/logo.png" alt="阿占" className="w-20 h-20 rounded-full object-cover" />
          <motion.div
            className="absolute inset-[-8px] rounded-full"
            style={{ border: '0.5px solid rgba(196, 149, 106, 0.15)' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>

        {/* Decorative line */}
        <motion.div
          className="hermes-divider mb-6"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        />

        {/* Title */}
        <motion.h2
          className="text-3xl text-warm-gold/80 tracking-[8px] mb-5"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {lang === 'tc' ? '阿占隨意' : '阿占随意'}
        </motion.h2>

        {/* Stats */}
        <motion.div
          className="flex items-center justify-center gap-8 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="text-center">
            <div className="text-2xl text-cream/80 font-mono tracking-wider">15</div>
            <div className="text-[10px] text-warm-light/30 tracking-[3px] mt-1 uppercase">
              {lang === 'tc' ? '張作品' : '张作品'}
            </div>
          </div>
          <div className="w-[0.5px] h-8 bg-warm-gold/10" />
          <div className="text-center">
            <div className="text-2xl text-cream/80 font-mono tracking-wider">{favorites.length}</div>
            <div className="text-[10px] text-warm-light/30 tracking-[3px] mt-1 uppercase">
              {lang === 'tc' ? '你的收藏' : '你的收藏'}
            </div>
          </div>
          <div className="w-[0.5px] h-8 bg-warm-gold/10" />
          <div className="text-center">
            <div className="text-2xl text-cream/80 font-mono tracking-wider">1</div>
            <div className="text-[10px] text-warm-light/30 tracking-[3px] mt-1 uppercase">
              {lang === 'tc' ? '個態度' : '个态度'}
            </div>
          </div>
        </motion.div>

        {/* Description */}
        <motion.p
          className="text-base text-cream/40 leading-[2] mb-10 max-w-xs mx-auto tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {lang === 'tc'
            ? '15張作品，同一個態度：用幽默面對生活，用溫柔善待自己。隨意，但不隨便。'
            : '15张作品，同一个态度：用幽默面对生活，用温柔善待自己。随意，但不随便。'}
        </motion.p>

        {/* Decorative line */}
        <motion.div
          className="hermes-divider mb-8"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        />

        {/* CTA Buttons */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          {/* WhatsApp */}
          <motion.button
            className="w-full py-5 bg-james-orange text-white text-sm tracking-[3px] uppercase flex items-center justify-center gap-3 rounded-xl shadow-lg shadow-james-orange/20"
            whileTap={{ scale: 0.97 }}
            onClick={handleWhatsApp}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {lang === 'tc' ? '聯絡阿占' : '联络阿占'}
          </motion.button>

          {/* Collage Generator */}
          <motion.button
            className="w-full py-5 text-sm tracking-[3px] text-warm-gold/60 border border-warm-gold/15 rounded-xl uppercase transition-all duration-300 hover:text-warm-gold/80 hover:border-warm-gold/25"
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCollage(true)}
          >
            🖼️ {lang === 'tc' ? '生成語錄卡片' : '生成语录卡片'}
          </motion.button>

          {/* Replay */}
          <motion.button
            className="w-full py-5 text-sm tracking-[3px] text-warm-gold/60 border border-warm-gold/15 rounded-xl uppercase transition-all duration-300 hover:text-warm-gold/80 hover:border-warm-gold/25"
            whileTap={{ scale: 0.97 }}
            onClick={handleReplay}
          >
            🔄 {lang === 'tc' ? '再睇一次' : '再看一次'}
          </motion.button>
        </motion.div>

        {/* Social proof */}
        <motion.p
          className="text-[10px] text-warm-gold mt-10 tracking-[4px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          {lang === 'tc' ? '已有 4,872 人看過這 15 張作品' : '已有 4,872 人看过这 15 张作品'}
        </motion.p>
      </motion.div>

      {showCollage && <CollageGenerator onClose={() => setShowCollage(false)} />}
    </div>
  );
}
