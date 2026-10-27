import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { trackEventImmediate, getSessionId } from '../api/reactionsApi';

export default function EndingScreen() {
  const { lang, setPhase, setCurrentSlide, favorites } = useAppStore();
  const [mood, setMood] = useState<string | null>(null);

  const handleReplay = () => {
    setCurrentSlide(0);
    setPhase('gallery');
  };

  // 2026-10-26 改版：IP showcase 定位——品牌合作洽詢直達阿Bot 線（85262322466）
  // 「索取阿占卡片」消費者入口已退役（CollageGenerator 保留檔案作復活點）
  // 預填尾帶 (JXxxxx) session 短碼：阿Bot 側對話可對返網站訪客行為（跨系統歸因）
  const handleCollab = () => {
    const shortCode = 'JX' + getSessionId().replace(/-/g, '').slice(0, 4).toUpperCase();
    trackEventImmediate('collab_cta_click', undefined, { lang, shortCode });
    const text =
      lang === 'tc'
        ? `你好，我對阿占隨意（JameStyle）嘅 IP 品牌合作／Crossover 有興趣，想了解合作方式。（${shortCode}）`
        : `你好，我对阿占随意（JameStyle）的 IP 品牌合作／Crossover 有兴趣，想了解合作方式。（${shortCode}）`;
    window.open(`https://wa.me/85262322466?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleReplayTracked = () => {
    trackEventImmediate('ending_replay_click', undefined, { lang });
    handleReplay();
  };

  // 結尾情緒反饋（一鍵三 emoji）——「睇完場 show 感覺如何」
  const handleMood = (m: string) => {
    if (mood) return;
    setMood(m);
    trackEventImmediate('ending_mood', undefined, { lang, mood: m });
  };

  return (
    <div className="relative bg-james-dark overflow-y-auto px-8 py-10">
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-james-orange/[0.04] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-warm-gold/[0.04] rounded-full blur-[120px]" />
      </div>

      <motion.div
        className="relative text-center max-w-sm mx-auto min-h-[100dvh] flex flex-col justify-center pt-16 pb-10"
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

        {/* Mood feedback（一鍵三 emoji） */}
        <motion.div
          className="flex items-center justify-center gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          {mood ? (
            <p className="text-warm-gold/70 text-sm tracking-[2px]">
              {lang === 'tc' ? '多謝你嘅感受 ✨' : '谢谢你的感受 ✨'}
            </p>
          ) : (
            <>
              <span className="text-warm-light/40 text-[10px] tracking-[3px] uppercase">
                {lang === 'tc' ? '睇完感覺' : '看完感觉'}
              </span>
              {[
                { m: 'delight', e: '🥰' },
                { m: 'amused', e: '😄' },
                { m: 'curious', e: '🤔' },
              ].map(({ m, e }) => (
                <button
                  key={m}
                  onClick={() => handleMood(m)}
                  className="w-11 h-11 rounded-full border border-warm-gold/15 bg-white/[0.02] text-xl hover:border-warm-gold/40 hover:scale-110 transition-all"
                  aria-label={m}
                >
                  {e}
                </button>
              ))}
            </>
          )}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          {/* 品牌合作洽詢（IP crossover——唯一 WhatsApp CTA） */}
          <motion.button
            className="w-full py-5 bg-james-orange text-white text-sm tracking-[3px] uppercase flex items-center justify-center gap-3 rounded-xl shadow-lg shadow-james-orange/20"
            whileTap={{ scale: 0.97 }}
            onClick={handleCollab}
          >
            🤝 {lang === 'tc' ? '品牌合作洽詢' : '品牌合作洽谈'}
          </motion.button>

          {/* Replay */}
          <motion.button
            className="w-full py-5 text-sm tracking-[3px] text-warm-gold/60 border border-warm-gold/15 rounded-xl uppercase transition-all duration-300 hover:text-warm-gold/80 hover:border-warm-gold/25"
            whileTap={{ scale: 0.97 }}
            onClick={handleReplayTracked}
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

        {/* Music credit */}
        <motion.p
          className="text-[9px] text-warm-gold/20 mt-4 tracking-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          Music from Pixabay — Royalty Free
        </motion.p>
      </motion.div>
    </div>
  );
}
