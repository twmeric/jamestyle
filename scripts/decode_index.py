import zipfile

zip_path = r"C:\Users\Owner\.kimi\sessions\893341e196bdf3507941dfe29f2095b7\fa26a565-7551-45ab-84be-ca2f589988b1\uploads\JameStyle SRC_45f17b.zip"

with zipfile.ZipFile(zip_path, 'r') as z:
    with z.open('index.html') as f:
        raw = f.read()
    
    print('Raw length:', len(raw))
    print('First 50 bytes:', ' '.join(f'{b:02x}' for b in raw[:50]))
    
    # Try different encodings
    for enc in ['utf-8', 'big5', 'cp950', 'gb2312', 'gbk', 'latin-1']:
        try:
            text = raw.decode(enc)
            if '<title>' in text:
                import re
                m = re.search(r'<title>([^<]*)</title>', text)
                if m:
                    print(f'\n{enc}: Title = {repr(m.group(1))}')
                m2 = re.search(r'name="description" content="([^"]*)"', text)
                if m2:
                    print(f'{enc}: Desc = {repr(m2.group(1)[:80])}')
                break
        except Exception as e:
            pass
