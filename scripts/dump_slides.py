import zipfile

zip_path = r"C:\Users\Owner\.kimi\sessions\893341e196bdf3507941dfe29f2095b7\fa26a565-7551-45ab-84be-ca2f589988b1\uploads\JameStyle SRC_45f17b.zip"

with zipfile.ZipFile(zip_path, 'r') as z:
    with z.open('src/data/slides.ts') as f:
        raw = f.read()
    
    with open('slides_dump.ts', 'wb') as out:
        out.write(raw)
    print('Saved to slides_dump.ts')
    
    with z.open('src/components/Opening.tsx') as f:
        raw2 = f.read()
    
    with open('opening_dump.tsx', 'wb') as out2:
        out2.write(raw2)
    print('Saved to opening_dump.tsx')
