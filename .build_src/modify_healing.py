import re

with open('src/components/HealingIntro.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 呼吸幕文字加大: text-lg md:text-xl → text-xl md:text-2xl
content = content.replace(
    'className="text-[#C4956A]/80 text-lg md:text-xl tracking-[6px]"',
    'className="text-[#C4956A]/80 text-xl md:text-2xl tracking-[6px]"'
)

# 2. 修改 phase 类型，添加 digest 子阶段状态
# 在 poppedBubbles 状态后添加 digestSubPhase
old_state = '''const [poppedBubbles, setPoppedBubbles] = useState<Set<number>>(new Set());
  const [centerQuote, setCenterQuote] = useState<string | null>(null);'''
new_state = '''const [poppedBubbles, setPoppedBubbles] = useState<Set<number>>(new Set());
  const [digestSubPhase, setDigestSubPhase] = useState<'quote' | 'ready'>('quote');
  const [centerQuote, setCenterQuote] = useState<string | null>(null);'''
content = content.replace(old_state, new_state)

# 3. 修改 digest 阶段逻辑：4秒 quote + 3秒 ready
old_digest = '''  // Digest: 3s → slideshow
  useEffect(() => {
    if (phase !== 'digest') return;
    const t = setTimeout(() => {
      setCenterQuote(null);
      setPhase('slideshow');
    }, 3000);
    return () => clearTimeout(t);
  }, [phase]);'''
new_digest = '''  // Digest: 4s quote + 3s ready → slideshow
  useEffect(() => {
    if (phase !== 'digest') return;
    setDigestSubPhase('quote');
    const t1 = setTimeout(() => setDigestSubPhase('ready'), 4000);
    const t2 = setTimeout(() => {
      setCenterQuote(null);
      setDigestSubPhase('quote');
      setPhase('slideshow');
    }, 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);'''
content = content.replace(old_digest, new_digest)

# 4. 修改轮播过渡为涟漪 clip-path
# 找到轮播图片的 motion.div 部分
old_slide_img = '''                    <motion.div
                      key={idx}
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.img
                        src={slide.img}
                        alt=""
                        className="w-full h-full object-contain rounded-xl"
                        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}
                        initial={{ scale: 0.96 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.96 }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </motion.div>'''
new_slide_img = '''                    <motion.div
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
                    </motion.div>'''
content = content.replace(old_slide_img, new_slide_img)

# 5. digest 阶段的文案显示：根据 digestSubPhase 显示不同内容
# 找到 digest 阶段的 centerQuote 显示部分
old_digest_quote = '''            {/* Center Quote */}
            <AnimatePresence mode="wait">
              {centerQuote && (
                <motion.div
                  key={centerQuote}
                  className="absolute inset-0 flex items-center justify-center px-8 pointer-events-none"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="max-w-[380px] text-center">
                    <HermesDivider className="max-w-[120px] mx-auto mb-5" />
                    <p className="text-[#F7F3EE] text-xl md:text-2xl leading-relaxed font-medium tracking-wide">
                      {centerQuote}
                    </p>
                    <HermesDivider className="max-w-[120px] mx-auto mt-5" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>'''
new_digest_quote = '''            {/* Center Quote / Transition */}
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
                          放下，其實比抓住更需要勇氣
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
                          準備好了，我們開始
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <HermesDivider className="max-w-[120px] mx-auto mt-6" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>'''
content = content.replace(old_digest_quote, new_digest_quote)

with open('src/components/HealingIntro.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done!')
