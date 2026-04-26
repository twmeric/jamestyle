import zipfile

zip_path = r"C:\Users\Owner\.kimi\sessions\893341e196bdf3507941dfe29f2095b7\fa26a565-7551-45ab-84be-ca2f589988b1\uploads\JameStyle SRC_45f17b.zip"

with zipfile.ZipFile(zip_path, 'r') as z:
    # 讀取 Opening.tsx
    with z.open('src/components/Opening.tsx') as f:
        raw = f.read()
    print('Opening.tsx length:', len(raw))
    print('First 20 bytes:', ' '.join(f'{b:02x}' for b in raw[:20]))
    try:
        text = raw.decode('utf-8')
        print('UTF-8 OK')
        print(text[:500])
    except Exception as e:
        print('Decode error:', e)
    
    print('\n--- slides.ts ---')
    with z.open('src/data/slides.ts') as f:
        raw2 = f.read()
    print('slides.ts length:', len(raw2))
    try:
        text2 = raw2.decode('utf-8')
        print('UTF-8 OK')
        print(text2[:500])
    except Exception as e:
        print('Decode error:', e)
