import subprocess
import re

result = subprocess.run(['git', 'show', '91e75a4:index.html'], capture_output=True)
raw = result.stdout
print('Length:', len(raw))
print('First 10 bytes:', ' '.join(f'{b:02x}' for b in raw[:10]))
print('Has BOM:', raw[:2] == b'\xff\xfe')

# 嘗試 UTF-8
try:
    text = raw.decode('utf-8')
    print('UTF-8 decode OK, length:', len(text))
    m = re.search(r'<title>([^<]*)</title>', text)
    if m:
        print('Title:', repr(m.group(1)))
    m2 = re.search(r'name="description" content="([^"]*)"', text)
    if m2:
        print('Desc:', repr(m2.group(1)[:100]))
except UnicodeDecodeError as e:
    print('UTF-8 decode failed:', e)
