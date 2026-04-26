with open('assets/index-Dvbk-C6d.js', 'rb') as f:
    raw = f.read()

# 搜索 UTF-8 編碼的 "James Style"
idx = raw.find(b'James Style')
if idx >= 0:
    print('Found James Style at', idx)
    snippet = raw[max(0, idx-100):idx+100]
    print('Snippet bytes:', ' '.join(f'{b:02x}' for b in snippet))
    try:
        text = snippet.decode('utf-8')
        print('Decoded:', repr(text))
    except UnicodeDecodeError:
        print('Cannot decode as UTF-8')

# 搜索 "15" 
idx2 = raw.find(b'15')
if idx2 >= 0:
    print('\nFound 15 at', idx2)
    snippet2 = raw[idx2:idx2+200]
    print('Snippet bytes:', ' '.join(f'{b:02x}' for b in snippet2))
