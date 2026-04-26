import re

encodings = ['utf-8', 'utf-8-sig', 'big5', 'gb2312', 'gbk', 'cp950', 'latin-1', 'iso-8859-1', 'cp1252']

for enc in encodings:
    try:
        with open('index.html', 'r', encoding=enc) as f:
            content = f.read()
        score = 0
        if 'James' in content:
            score += 10
        if 'jamestyle' in content.lower():
            score += 10
        if '\u4eba\u751f' in content or '\u8a9e' in content:
            score += 10
        if '<title>' in content:
            score += 5
            
        if score > 0:
            print(f'ENCODING: {enc}  (score={score})')
            m = re.search(r'<title>([^<]*)</title>', content)
            if m:
                print(f'Title: {repr(m.group(1))}')
            break
    except Exception as e:
        pass
else:
    print('No encoding matched. Trying binary...')
    with open('index.html', 'rb') as f:
        data = f.read()
    print(f'First 30 bytes: {data[:30]}')
    print(f'File size: {len(data)}')
