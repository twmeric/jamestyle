import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { SLIDES } from '../data/slides';
import { trackEventImmediate, getSessionId } from '../api/reactionsApi';
import { unlockAchievement } from '../utils/achievements';

interface Props {
  onClose: () => void;
}

const CANVAS_W = 1080;
const CANVAS_H = 1080;

const API_BASE = 'https://jamestyle-analytics.jimsbond007.workers.dev';

async function requestCardShare(slideId: number, sessionId?: string) {
  const res = await fetch(`${API_BASE}/api/public/card-share/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slideId, sessionId }),
  });
  return res.json();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const chars = text.split('');
  let line = '';
  const lines: string[] = [];
  for (const char of chars) {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = char;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

type Step = 'select' | 'generating' | 'result';

export default function CollageGenerator({ onClose }: Props) {
  const { lang } = useAppStore();
  const t = (tc: string, sc: string) => (lang === 'sc' ? sc : tc);

  const [step, setStep] = useState<Step>('select');
  const [selectedSlideId, setSelectedSlideId] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [shareNotice, setShareNotice] = useState<string>('');
  const imageUrlRef = useRef<string>('');

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    trackEventImmediate('collage_open');
  }, []);

  const generateCard = useCallback(
    async (slideId: number) => {
      setStep('generating');
      const slide = SLIDES.find((s) => s.id === slideId);
      if (!slide) return;

      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_W;
      canvas.height = CANVAS_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Background
      ctx.fillStyle = '#FAF8F3';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // 2. Load and draw image with frame
      const img = await loadImage(slide.img);
      const maxW = 700;
      const maxH = 520;
      const aspect =
        img.naturalWidth && img.naturalHeight
          ? img.naturalWidth / img.naturalHeight
          : 1;
      let dw = maxW;
      let dh = maxW / aspect;
      if (dh > maxH) {
        dh = maxH;
        dw = maxH * aspect;
      }

      const imgX = Math.round((CANVAS_W - dw) / 2);
      const imgY = 80;
      const frameX = imgX - 12;
      const frameY = imgY - 12;
      const frameW = dw + 24;
      const frameH = dh + 24;

      // White frame with subtle shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(frameX, frameY, frameW, frameH);
      ctx.restore();

      // Gold line (inner edge of frame)
      ctx.strokeStyle = '#C4956A';
      ctx.lineWidth = 1;
      ctx.strokeRect(imgX - 1, imgY - 1, dw + 2, dh + 2);

      // Image
      if (img.naturalWidth > 0) {
        ctx.drawImage(img, imgX, imgY, dw, dh);
      }

      // 3. Quote text
      ctx.fillStyle = '#5A5248';
      ctx.textAlign = 'center';

      const quoteY = imgY + dh + 60;
      const maxTextWidth = 860;
      const caption = slide.caption[lang];

      // Determine font size based on caption length
      let fontSize = 42;
      let lineHeight = 56;
      if (caption.length > 20) {
        fontSize = 36;
        lineHeight = 48;
      }
      if (caption.length > 40) {
        fontSize = 30;
        lineHeight = 42;
      }
      ctx.font = `${fontSize}px "LXGW WenKai", "PingFang TC", sans-serif`;

      const rawLines = caption.split('\n');
      const lines: string[] = [];
      for (const raw of rawLines) {
        const wrapped = wrapText(ctx, raw, maxTextWidth);
        lines.push(...wrapped);
      }

      // Scale down further if too many lines after wrapping
      if (lines.length > 4) {
        fontSize = 26;
        lineHeight = 36;
        ctx.font = `${fontSize}px "LXGW WenKai", "PingFang TC", sans-serif`;
        lines.length = 0;
        for (const raw of rawLines) {
          const wrapped = wrapText(ctx, raw, maxTextWidth);
          lines.push(...wrapped);
        }
      }

      lines.forEach((line, i) => {
        ctx.fillText(line, CANVAS_W / 2, quoteY + i * lineHeight);
      });

      // 4. Signature
      const sigY = quoteY + lines.length * lineHeight + 40;
      ctx.fillStyle = 'rgba(196, 149, 106, 0.8)';
      ctx.font = `26px "LXGW WenKai", "PingFang TC", sans-serif`;
      ctx.fillText('— ' + t('阿占隨意', '阿占随意'), CANVAS_W / 2, sigY);

      // 5. Postmark stamp (dashed concentric circles)
      const stampY = sigY + 70;
      const stampRadius = 55;
      ctx.save();
      ctx.translate(CANVAS_W / 2, stampY);
      ctx.strokeStyle = 'rgba(196, 149, 106, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, stampRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, stampRadius - 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(90, 82, 72, 0.5)';
      ctx.font = `14px "LXGW WenKai", "PingFang TC", sans-serif`;
      ctx.textAlign = 'center';
      const today = new Date().toLocaleDateString('zh-HK');
      ctx.fillText(today, 0, -4);
      ctx.font = '12px monospace';
      ctx.fillStyle = 'rgba(90, 82, 72, 0.35)';
      ctx.fillText('JAMESTYLE', 0, 14);
      ctx.restore();

      // 6. Footer
      ctx.fillStyle = '#5A5248';
      ctx.font = `bold 22px "LXGW WenKai", "PingFang TC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('JameStyle.com', CANVAS_W / 2, CANVAS_H - 80);

      // Export
      canvas.toBlob((blob) => {
        if (!blob) return;
        if (imageUrlRef.current) {
          URL.revokeObjectURL(imageUrlRef.current);
        }
        const url = URL.createObjectURL(blob);
        imageUrlRef.current = url;
        setImageUrl(url);
        setStep('result');
      }, 'image/png');

      trackEventImmediate('collage_generate', undefined, {
        slideId,
        caption,
      });
      unlockAchievement('collage_creator');
    },
    [lang, t]
  );

  const handleSelectSlide = (slideId: number) => {
    setSelectedSlideId(slideId);
    trackEventImmediate('collage_slide_select', undefined, { slideId });
    generateCard(slideId);
  };

  const handleDownload = () => {
    if (!imageUrl || !selectedSlideId) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `jamestyle-card-${selectedSlideId}-${Date.now()}.png`;
    a.click();
    trackEventImmediate('card_download', undefined, { slideId: selectedSlideId });
  };

  const handleShare = async () => {
    if (!selectedSlideId) return;
    try {
      const sessionId = getSessionId();
      const res = await requestCardShare(selectedSlideId, sessionId);
      if (res.deepLink) {
        window.open(res.deepLink, '_blank');
        setShareNotice(
          t('已開啟 WhatsApp，請發送給阿占 ✨', '已开启 WhatsApp，请发送给阿占 ✨')
        );
        trackEventImmediate('card_share_click', undefined, {
          slideId: selectedSlideId,
          shareToken: res.shareToken,
        });
      } else {
        setShareNotice(
          t('分享連結生成失敗，請重試', '分享链接生成失败，请重试')
        );
      }
    } catch {
      setShareNotice(
        t('分享連結生成失敗，請重試', '分享链接生成失败，请重试')
      );
    }
    setTimeout(() => setShareNotice(''), 4000);
  };

  return (
    <div className="fixed inset-0 bg-james-dark/95 backdrop-blur-xl z-[70] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top,8px)] pb-3 shrink-0">
        <h2 className="text-sm text-warm-gold tracking-[4px]">
          {step === 'select' && t('🖼️ 選擇一張作品', '🖼️ 选择一张作品')}
          {step === 'generating' && t('✨ 製作中', '✨ 制作中')}
          {step === 'result' && t('🎁 你的語錄卡片', '🎁 你的语录卡片')}
        </h2>
        <button
          onClick={onClose}
          className="text-cream/50 hover:text-cream text-sm px-3 py-1 border border-white/10 rounded"
        >
          ✕
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Select slide */}
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto px-5 pb-6"
          >
            <p className="text-xs text-cream/40 text-center mb-4">
              {t(
                '點擊一張作品，生成專屬語錄卡片',
                '点击一张作品，生成专属语录卡片'
              )}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {SLIDES.map((slide) => (
                <motion.button
                  key={slide.id}
                  className="relative aspect-square rounded-xl overflow-hidden border-2 border-white/5 hover:border-warm-gold/40 transition-all duration-300"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectSlide(slide.id)}
                >
                  <img
                    src={slide.img}
                    alt={slide.caption[lang]}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <span className="text-2xl">{slide.emoji}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Generating */}
        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="text-4xl mb-4"
            >
              ✉️
            </motion.div>
            <p className="text-sm text-cream/60">
              {t('正在為你製作卡片...', '正在为你制作卡片...')}
            </p>
          </motion.div>
        )}

        {/* Step 3: Result */}
        {step === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-5 pb-6 overflow-y-auto"
          >
            <div className="relative max-h-[55vh] rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/5 mt-4">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="card"
                  className="h-full w-auto object-contain"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5 w-full max-w-xs">
              <motion.button
                className="py-3 bg-white/5 text-cream text-sm tracking-[2px] rounded-xl border border-white/10 flex items-center justify-center gap-2"
                whileTap={{ scale: 0.97 }}
                onClick={handleDownload}
              >
                ⬇️ {t('下載保存', '下载保存')}
              </motion.button>
              <motion.button
                className="py-3 bg-james-orange text-white text-sm tracking-[2px] rounded-xl shadow-lg shadow-james-orange/20 flex items-center justify-center gap-2"
                whileTap={{ scale: 0.97 }}
                onClick={handleShare}
              >
                📲 {t('傳給阿占', '传给阿占')}
              </motion.button>
            </div>

            {shareNotice && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-xs text-warm-gold text-center"
              >
                {shareNotice}
              </motion.p>
            )}

            <motion.button
              className="mt-3 text-xs text-cream/40 hover:text-cream/60 tracking-[2px]"
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setSelectedSlideId(null);
                if (imageUrlRef.current) {
                  URL.revokeObjectURL(imageUrlRef.current);
                  imageUrlRef.current = '';
                }
                setImageUrl('');
                setShareNotice('');
                setStep('select');
              }}
            >
              🔄 {t('重新選擇', '重新选择')}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
