import { useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SLIDES } from '../data/slides';
import { useAppStore } from '../store/appStore';
import { trackEventImmediate } from '../api/reactionsApi';

export default function ShareModal() {
  const { lang, showShareModal, setShowShareModal, shareSlideId } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const slide = SLIDES.find(s => s.id === shareSlideId);

  const generateCard = useCallback(async () => {
    if (!slide || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;

    // === Elegant warm gradient background ===
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#FBF9F4');
    bg.addColorStop(0.3, '#FFF6E8');
    bg.addColorStop(0.7, '#FFF0D6');
    bg.addColorStop(1, '#FAF5EE');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // === Subtle corner ornaments ===
    ctx.strokeStyle = 'rgba(196, 149, 106, 0.12)';
    ctx.lineWidth = 1;
    const ornLen = 60;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(60, 60 + ornLen); ctx.lineTo(60, 60); ctx.lineTo(60 + ornLen, 60);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(W - 60 - ornLen, 60); ctx.lineTo(W - 60, 60); ctx.lineTo(W - 60, 60 + ornLen);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(60, H - 60 - ornLen); ctx.lineTo(60, H - 60); ctx.lineTo(60 + ornLen, H - 60);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(W - 60 - ornLen, H - 60); ctx.lineTo(W - 60, H - 60); ctx.lineTo(W - 60, H - 60 - ornLen);
    ctx.stroke();

    // === Load image ===
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = slide.img;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    // === Top branding area ===
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0D0B09';
    ctx.font = `bold 36px "PingFang TC", "Microsoft JhengHei", sans-serif`;
    ctx.fillText('阿占隨意', W / 2, 110);

    ctx.fillStyle = '#C4956A';
    ctx.font = `italic 18px "Georgia", "Times New Roman", serif`;
    ctx.fillText('James Style', W / 2, 142);

    // Top decorative gold line
    const goldLine = ctx.createLinearGradient(W / 2 - 50, 0, W / 2 + 50, 0);
    goldLine.addColorStop(0, 'rgba(196, 149, 106, 0)');
    goldLine.addColorStop(0.3, 'rgba(196, 149, 106, 0.6)');
    goldLine.addColorStop(0.7, 'rgba(196, 149, 106, 0.6)');
    goldLine.addColorStop(1, 'rgba(196, 149, 106, 0)');
    ctx.fillStyle = goldLine;
    ctx.fillRect(W / 2 - 50, 160, 100, 1);

    // === White card with image ===
    const cardMargin = 90;
    const cardTop = 190;
    const cardW = W - cardMargin * 2;
    const cardH = 680;
    const cardR = 20;

    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.05)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 15;
    ctx.beginPath();
    ctx.moveTo(cardMargin + cardR, cardTop);
    ctx.arcTo(cardMargin + cardW, cardTop, cardMargin + cardW, cardTop + cardH, cardR);
    ctx.arcTo(cardMargin + cardW, cardTop + cardH, cardMargin, cardTop + cardH, cardR);
    ctx.arcTo(cardMargin, cardTop + cardH, cardMargin, cardTop, cardR);
    ctx.arcTo(cardMargin, cardTop, cardMargin + cardW, cardTop, cardR);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Thin gold border on card
    ctx.strokeStyle = 'rgba(196, 149, 106, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // === Draw image inside card ===
    const imgPad = 30;
    const imgAreaW = cardW - imgPad * 2;
    const imgAreaH = cardH - imgPad * 2;
    const aspectRatio = img.width / img.height;
    let drawW = imgAreaW;
    let drawH = imgAreaH;
    if (aspectRatio > imgAreaW / imgAreaH) {
      drawH = imgAreaW / aspectRatio;
    } else {
      drawW = imgAreaH * aspectRatio;
    }
    const drawX = cardMargin + imgPad + (imgAreaW - drawW) / 2;
    const drawY = cardTop + imgPad + (imgAreaH - drawH) / 2;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    // === Caption text ===
    const caption = slide.caption[lang];
    ctx.fillStyle = '#3A342E';
    ctx.font = `36px "PingFang TC", "Microsoft JhengHei", sans-serif`;
    ctx.textAlign = 'center';

    const maxTextW = W - 160;
    const chars = caption.split('');
    let line = '';
    const lines: string[] = [];
    for (const char of chars) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxTextW) {
        lines.push(line);
        line = char;
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    const lineHeight = 58;
    const textBlockH = lines.length * lineHeight;
    const captionStartY = cardTop + cardH + 50 + lineHeight;

    // Left & right decorative quotes
    ctx.fillStyle = 'rgba(196, 149, 106, 0.2)';
    ctx.font = `80px "Georgia", serif`;
    ctx.fillText('「', W / 2 - maxTextW / 2 - 10, captionStartY - 10);
    ctx.fillText('」', W / 2 + maxTextW / 2 + 10, captionStartY + textBlockH - 20);

    // Actual caption
    ctx.fillStyle = '#3A342E';
    ctx.font = `36px "PingFang TC", "Microsoft JhengHei", sans-serif`;
    lines.forEach((l, i) => {
      ctx.fillText(l, W / 2, captionStartY + i * lineHeight);
    });

    // === Bottom branding section ===
    const bottomY = H - 160;

    // Decorative gold line
    const bottomLine = ctx.createLinearGradient(W / 2 - 40, 0, W / 2 + 40, 0);
    bottomLine.addColorStop(0, 'rgba(196, 149, 106, 0)');
    bottomLine.addColorStop(0.3, 'rgba(196, 149, 106, 0.5)');
    bottomLine.addColorStop(0.7, 'rgba(196, 149, 106, 0.5)');
    bottomLine.addColorStop(1, 'rgba(196, 149, 106, 0)');
    ctx.fillStyle = bottomLine;
    ctx.fillRect(W / 2 - 40, bottomY, 80, 1);

    // Brand name
    ctx.fillStyle = '#C4956A';
    ctx.font = `24px "PingFang TC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('阿 占 隨 意  James Style', W / 2, bottomY + 40);

    // Slogan
    ctx.fillStyle = '#B8A88A';
    ctx.font = `17px "PingFang TC", sans-serif`;
    ctx.fillText(lang === 'tc' ? '隨 意 ， 但 不 隨 便' : '随 意 ， 但 不 随 便', W / 2, bottomY + 72);

    // Website
    ctx.fillStyle = 'rgba(196, 149, 106, 0.5)';
    ctx.font = `14px "Georgia", serif`;
    ctx.fillText('jamestyle.com', W / 2, bottomY + 100);
  }, [slide, lang]);

  const handleDownload = useCallback(async () => {
    trackEventImmediate('share_action', slide?.id, {
      action: 'download',
      platform: 'download',
    });
    await generateCard();
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `james-style-${slide?.id || 'card'}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }, [generateCard, slide]);

  const handleWebShare = useCallback(async () => {
    const platform = navigator.share ? 'native_share' : 'download_fallback';
    trackEventImmediate('share_action', slide?.id, {
      action: 'webshare',
      platform,
    });
    await generateCard();
    if (!canvasRef.current) return;

    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `james-style-${slide?.id}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: '阿占隨意 James Style',
            text: `${slide?.caption[lang]}\n\nhttps://jamestyle.com`,
            files: [file],
          });
        } else {
          handleDownload();
        }
      });
    } catch {
      handleDownload();
    }
  }, [generateCard, slide, lang, handleDownload]);

  const handleWhatsApp = () => {
    trackEventImmediate('share_action', slide?.id, {
      action: 'whatsapp',
      platform: 'whatsapp',
    });
    const text = encodeURIComponent(
      `${slide?.caption[lang] || ''}\n\n— 阿占隨意 James Style\nhttps://jamestyle.com`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (!slide) return null;

  return (
    <AnimatePresence>
      {showShareModal && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-[#161412] md:rounded-2xl p-7 w-full max-w-md mx-4"
            style={{ border: '0.5px solid rgba(196, 149, 106, 0.1)' }}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
          >
            {/* Handle */}
            <div className="flex justify-center mb-5 md:hidden">
              <div className="w-8 h-[0.5px] bg-warm-gold/20" />
            </div>

            <h3 className="text-base text-cream/80 text-center mb-1 tracking-[4px]">
              {lang === 'tc' ? '分享這份態度' : '分享这份态度'}
            </h3>
            <p className="text-[10px] text-warm-light/30 text-center mb-7 tracking-[2px]">
              {lang === 'tc' ? '生成專屬語錄卡，讓好友也感受阿占的智慧' : '生成专属语录卡，让好友也感受阿占的智慧'}
            </p>

            {/* Preview */}
            <div className="share-card-gradient rounded-xl p-6 mb-7 text-center">
              <img src={slide.img} alt="" className="w-28 h-28 mx-auto object-contain mb-4" />
              <p className="text-sm text-[#5A5248] leading-[2] mb-3 tracking-wide">{slide.caption[lang]}</p>
              <div className="hermes-divider mb-2" />
              <p className="text-[9px] text-warm-gold/60 tracking-[4px]">阿占隨意 James Style</p>
            </div>

            {/* Hidden canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Share actions */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <motion.button
                className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300"
                style={{ background: 'rgba(255, 255, 255, 0.03)', border: '0.5px solid rgba(255, 255, 255, 0.06)' }}
                whileTap={{ scale: 0.92 }}
                onClick={handleDownload}
              >
                <span className="text-xl">💾</span>
                <span className="text-[10px] text-cream/40 tracking-wider">
                  {lang === 'tc' ? '儲存圖片' : '保存图片'}
                </span>
              </motion.button>

              <motion.button
                className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300"
                style={{ background: 'rgba(37, 211, 102, 0.04)', border: '0.5px solid rgba(37, 211, 102, 0.12)' }}
                whileTap={{ scale: 0.92 }}
                onClick={handleWhatsApp}
              >
                <span className="text-xl">💬</span>
                <span className="text-[10px] text-[#25D366]/60 tracking-wider">WhatsApp</span>
              </motion.button>

              <motion.button
                className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300"
                style={{ background: 'rgba(96, 165, 250, 0.04)', border: '0.5px solid rgba(96, 165, 250, 0.12)' }}
                whileTap={{ scale: 0.92 }}
                onClick={handleWebShare}
              >
                <span className="text-xl">📲</span>
                <span className="text-[10px] text-blue-400/50 tracking-wider">
                  {lang === 'tc' ? '更多分享' : '更多分享'}
                </span>
              </motion.button>
            </div>

            {/* Close */}
            <motion.button
              className="w-full py-3.5 text-xs text-cream/30 tracking-[3px] hermes-border uppercase rounded-xl transition-all duration-300 hover:text-cream/50"
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowShareModal(false)}
            >
              {lang === 'tc' ? '返回' : '返回'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
