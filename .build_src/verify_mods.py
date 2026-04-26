with open('src/components/HealingIntro.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

checks = [
    ('Breathing text size', 'text-xl md:text-2xl' in content),
    ('Breathing 6s', "setTimeout(() => setPhase('bubbles'), 6000)" in content),
    ('Digest sub phase', 'digestSubPhase' in content),
    ('Digest 4s + 3s', "setTimeout(() => setDigestSubPhase('ready'), 4000)" in content),
    ('Clip path ripple', 'clipPath' in content and 'circle' in content),
    ('Quote text', '放下，其實比抓住更需要勇氣' in content),
    ('Ready text', '準備好了，我們開始' in content),
]

for name, ok in checks:
    print(f'{name}: OK' if ok else f'{name}: FAIL')
