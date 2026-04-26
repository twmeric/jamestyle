with open('index.html', 'rb') as f:
    raw = f.read()

# 直接看 description 附近的原始字節
idx = raw.find(b'name="description"')
if idx >= 0:
    snippet = raw[idx:idx+200]
    print('Raw bytes around description:')
    print(' '.join(f'{b:02x}' for b in snippet))
    print()
    # 嘗試用 UTF-8 解碼
    try:
        s = snippet.decode('utf-8')
        print('UTF-8 decoded:', repr(s))
    except UnicodeDecodeError as e:
        print('UTF-8 decode error:', e)
        # 嘗試用其他編碼
        for enc in ['utf-8-sig', 'latin-1', 'cp1252', 'gb2312', 'big5']:
            try:
                s = snippet.decode(enc)
                print(f'{enc}:', repr(s))
                break
            except:
                pass
