import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';
import { unlockAchievement } from '../utils/achievements';
import CollageGenerator from './CollageGenerator';
import {
  toggleBgm,
  isBgmEnabled,
  setBgmVolume,
  getBgmVolume,
  getCurrentTrack,
} from '../utils/soundManager';

export default function LangToggle() {
  const { lang, setLang, soundEnabled, toggleSound, phase, setPhase, currentSlide } = useAppStore();

  // BGM mini-panel state
  const [bgmOpen, setBgmOpen] = useState(false);
  const [bgmEnabled, setBgmEnabled] = useState(false);
  const [bgmVolume, setBgmVolumeState] = useState(getBgmVolume());
  const [currentTrack, setCurrentTrack] = useState(getCurrentTrack());

  // Menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCollage, setShowCollage] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTrack(getCurrentTrack());
      setBgmEnabled(isBgmEnabled());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleBgmToggle = useCallback(() => {
    const newState = toggleBgm();
    setBgmEnabled(newState);
  }, []);

  const handleBgmVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setBgmVolume(v);
    setBgmVolumeState(v);
  }, []);

  const trackLabels: Record<string, string> = {
    healing: '療癒序曲',
    gallery: '隨意畫廊',
    ending: '溫暖餘韻',
  };

  const t = (tc: string, sc: string) => lang === 'sc' ? sc : tc;

  const menuItems = [
    { id: 'healing' as const, label: t('回到開場', '回到开场'), emoji: '🏠' },
    { id: 'gallery' as const, label: t('畫廊', '画廊'), emoji: '🖼️' },
    { id: 'ending' as const, label: t('前往結尾', '前往结尾'), emoji: '🎉' },
  ];

  return (
    <>
      {/* Main toolbar */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            filter: drop-shadow(0 0 2px rgba(243,112,33,0.5)) drop-shadow(0 0 4px rgba(243,112,33,0.3));
          }
          50% {
            filter: drop-shadow(0 0 5px #F37021) drop-shadow(0 0 10px rgba(243,112,33,0.8)) drop-shadow(0 0 20px rgba(243,112,33,0.5));
          }
        }
      `}</style>
      <motion.div
        className={`fixed top-3 right-3 z-[60] flex items-center p-0.5 rounded-lg ${
          phase === 'gallery'
            ? 'bg-transparent'
            : 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]'
        }`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {/* Menu Toggle */}
        <button
          className={`w-9 h-9 flex items-center justify-center rounded-md transition-all duration-300 ${
            phase === 'gallery'
              ? `hover:bg-black/5 ${menuOpen ? 'bg-black/10 text-[#C4956A]' : 'text-gray-500'}`
              : `hover:bg-white/5 ${menuOpen ? 'bg-white/10 text-warm-gold' : 'text-warm-light/60'}`
          }`}
          onClick={() => {
            setMenuOpen(!menuOpen);
            setBgmOpen(false);
          }}
          title={t('選單', '选单')}
        >
          <span className="text-sm">☰</span>
        </button>

        <div className={`w-px h-5 mx-0.5 ${phase === 'gallery' ? 'bg-black/10' : 'bg-white/10'}`} />

        {/* Sound Effects Toggle */}
        <button
          className={`w-9 h-9 flex items-center justify-center rounded-md transition-all duration-300 ${
            phase === 'gallery' ? 'hover:bg-black/5' : 'hover:bg-white/5'
          }`}
          onClick={() => {
            const newState = toggleSound();
            if (newState) unlockAchievement('sound_on');
          }}
          title={soundEnabled ? t('關閉音效', '关闭音效') : t('開啟音效', '开启音效')}
        >
          <span className="text-sm">{soundEnabled ? '🔊' : '🔇'}</span>
        </button>

        <div className={`w-px h-5 mx-0.5 ${phase === 'gallery' ? 'bg-black/10' : 'bg-white/10'}`} />

        {/* BGM Toggle */}
        <button
          className={`w-9 h-9 flex items-center justify-center rounded-md transition-all duration-300 relative ${
            phase === 'gallery' ? 'hover:bg-black/5' : 'hover:bg-white/5'
          }`}
          onClick={() => {
            setBgmOpen(!bgmOpen);
            setMenuOpen(false);
          }}
          title={t('背景音樂', '背景音乐')}
        >
          <span
            className="text-sm"
            style={
              bgmEnabled && currentTrack
                ? { animation: 'pulse-glow 2s ease-in-out infinite' }
                : undefined
            }
          >
            {bgmEnabled ? '🎵' : '🎶'}
          </span>
        </button>

        <div className={`w-px h-5 mx-0.5 ${phase === 'gallery' ? 'bg-black/10' : 'bg-white/10'}`} />

        {/* Lang Toggle — Single button showing the *other* language */}
        <button
          className={`w-9 h-9 flex items-center justify-center rounded-md text-xs tracking-[2px] transition-all duration-300 ${
            phase === 'gallery'
              ? 'text-gray-400 hover:text-gray-600 hover:bg-black/5'
              : 'text-warm-light/50 hover:text-warm-light/80 hover:bg-white/5'
          }`}
          onClick={() => setLang(lang === 'tc' ? 'sc' : 'tc')}
          title={lang === 'tc' ? '切换为简体' : '切換為繁體'}
        >
          {lang === 'tc' ? '简' : '繁'}
        </button>
      </motion.div>

      {/* Menu dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-14 right-3 z-[60] py-2 rounded-xl min-w-[160px]"
            style={{
              background: phase === 'gallery' ? 'rgba(250, 248, 243, 0.96)' : 'rgba(13, 11, 9, 0.92)',
              backdropFilter: 'blur(20px)',
              border: phase === 'gallery' ? '0.5px solid rgba(0, 0, 0, 0.08)' : '0.5px solid rgba(196, 149, 106, 0.2)',
              boxShadow: phase === 'gallery' ? '0 8px 32px rgba(0,0,0,0.08)' : '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Menu header */}
            <div className={`px-4 pb-2 mb-1 border-b ${phase === 'gallery' ? 'border-black/5' : 'border-white/5'}`}>
              <span className={`text-[10px] tracking-wider ${phase === 'gallery' ? 'text-[#C4956A]/70' : 'text-warm-gold/60'}`}>☰ {t('選單', '选单')}</span>
            </div>

            {/* Navigation items */}
            {menuItems.map((item) => {
              const isCurrent = phase === item.id;
              return (
                <button
                  key={item.id}
                  disabled={isCurrent}
                  onClick={() => {
                    setPhase(item.id);
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center gap-2 ${
                    isCurrent
                      ? phase === 'gallery' ? 'text-[#C4956A] cursor-default' : 'text-warm-gold cursor-default'
                      : phase === 'gallery' ? 'text-gray-600 hover:text-gray-900 hover:bg-black/5' : 'text-cream/70 hover:text-cream hover:bg-white/5'
                  }`}
                >
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                  {isCurrent && (
                    <span className={`ml-auto text-[10px] ${phase === 'gallery' ? 'text-[#C4956A]/60' : 'text-warm-gold/60'}`}>{t('(當前)', '(当前)')}</span>
                  )}
                </button>
              );
            })}

            {/* Divider */}
            <div className={`border-t my-1 ${phase === 'gallery' ? 'border-black/5' : 'border-white/5'}`} />

            {/* Share card */}
            <button
              onClick={() => {
                setShowCollage(true);
                setMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center gap-2 ${
                phase === 'gallery' ? 'text-gray-600 hover:text-gray-900 hover:bg-black/5' : 'text-cream/70 hover:text-cream hover:bg-white/5'
              }`}
            >
              <span>🔗</span>
              <span>{t('分享卡片', '分享卡片')}</span>
            </button>

            {/* License */}
            <button
              onClick={() => {
                setShowLicenseModal(true);
                setMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center gap-2 ${
                phase === 'gallery' ? 'text-gray-600 hover:text-gray-900 hover:bg-black/5' : 'text-cream/70 hover:text-cream hover:bg-white/5'
              }`}
            >
              <span>📜</span>
              <span>{t('授權須知', '授权须知')}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BGM mini panel */}
      <AnimatePresence>
        {bgmOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-14 right-3 z-[60] px-4 py-3 rounded-xl"
            style={{
              background: phase === 'gallery' ? 'rgba(250, 248, 243, 0.96)' : 'rgba(13, 11, 9, 0.92)',
              backdropFilter: 'blur(20px)',
              border: phase === 'gallery' ? '0.5px solid rgba(0, 0, 0, 0.08)' : '0.5px solid rgba(196, 149, 106, 0.2)',
              boxShadow: phase === 'gallery' ? '0 8px 32px rgba(0,0,0,0.08)' : '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div className="flex flex-col gap-2 min-w-[130px]">
              <div className="flex items-center justify-center">
                <span className={`text-[10px] tracking-wider ${phase === 'gallery' ? 'text-[#C4956A]/80' : 'text-warm-gold/70'}`}>
                  {trackLabels[currentTrack || ''] || t('靜音中', '静音中')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={bgmVolume}
                onChange={handleBgmVolume}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #C4956A ${bgmVolume * 100}%, ${phase === 'gallery' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'} ${bgmVolume * 100}%)`,
                }}
              />
              <p className={`text-[9px] tracking-wider text-center ${phase === 'gallery' ? 'text-gray-400' : 'text-cream/25'}`}>
                Music from Pixabay
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collage Generator Modal */}
      {showCollage && <CollageGenerator onClose={() => setShowCollage(false)} />}

      {/* License Modal */}
      <AnimatePresence>
        {showLicenseModal && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center px-6"
            style={{ background: 'rgba(0, 0, 0, 0.6)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLicenseModal(false)}
          >
            <motion.div
              className="relative w-full max-w-sm rounded-2xl p-8 max-h-[80vh] overflow-y-auto"
              style={{
                background: 'rgba(13, 11, 9, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '0.5px solid rgba(196, 149, 106, 0.2)',
              }}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 text-cream/40 hover:text-cream/80 transition-colors"
                onClick={() => setShowLicenseModal(false)}
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <h3 className="text-xl text-warm-gold/80 tracking-[4px] mb-6 text-center">
                {t('授權須知', '授权须知')}
              </h3>
              <div className="text-cream/60 text-sm leading-[2] tracking-wide whitespace-pre-line">
                {lang === 'tc'
                  ? `📋 JameStyle.com 內容授權須知\n\n本網站所有內容（包括但不限於：阿占語錄、插畫作品、品牌標識）均受版權保護。\n\n🏠 私人使用（免費開源）\n歡迎個人用戶免費使用 JameStyle 的語錄和插畫進行二次創作，包括但不限於：\n• 個人社交媒體分享\n• 個人學習及研究\n• 非商業性質的個人創作\n\n唯一要求：請註明出處「JameStyle.com」或「阿占隨意」。\n\n💼 商業應用（需授權簽約）\n任何商業用途均需事先獲得書面授權，包括但不限於：\n• 商業廣告及宣傳\n• 產品包裝及周邊商品\n• 企業內部培訓及商用演示\n• 媒體轉載及出版\n\n如需商業授權，請通過 WhatsApp 聯繫我們洽談合作細節及費用。\n\n📞 聯繫方式\nWhatsApp: +852 6881 0677\nWebsite: jamestyle.com`
                  : `📋 JameStyle.com 内容授权须知\n\n本网站所有内容（包括但不限于：阿占语录、插画作品、品牌标识）均受版权保护。\n\n🏠 私人使用（免费开源）\n欢迎个人用户免费使用 JameStyle 的语录和插画进行二次创作，包括但不限于：\n• 个人社交媒体分享\n• 个人学习及研究\n• 非商业性质的个人创作\n\n唯一要求：请注明出处「JameStyle.com」或「阿占随意」。\n\n💼 商业应用（需授权签约）\n任何商业用途均需事先获得书面授权，包括但不限于：\n• 商业广告及宣传\n• 产品包装及周边商品\n• 企业内部培训及商用演示\n• 媒体转载及出版\n\n如需商业授权，请通过 WhatsApp 联系我们洽谈合作细节及费用。\n\n📞 联系方式\nWhatsApp: +852 6881 0677\nWebsite: jamestyle.com`}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
