import os

# 檢查 App.tsx
path = '.tmp_src/src/App.tsx'
if os.path.exists(path):
    with open(path, 'rb') as f:
        raw = f.read()
    print('App.tsx length:', len(raw))
    print('First 20 bytes:', ' '.join(f'{b:02x}' for b in raw[:20]))
    try:
        text = raw.decode('utf-8')
        print('UTF-8 OK')
        # 找中文
        import re
        chinese = re.findall(r'[\u4e00-\u9fff]+', text)
        print('Chinese phrases:', chinese[:20])
    except Exception as e:
        print('Decode error:', e)
else:
    print('App.tsx not found')
