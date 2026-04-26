import re

# 檢查 zip 中的 dist/index.html
with open('.tmp_src/dist/index.html', 'rb') as f:
    raw = f.read()
print('dist/index.html length:', len(raw))
print('First 10 bytes:', ' '.join(f'{b:02x}' for b in raw[:10]))

try:
    text = raw.decode('utf-8')
    print('UTF-8 OK')
    m = re.search(r'<title>([^<]*)</title>', text)
    if m:
        print('Title:', repr(m.group(1)))
    m2 = re.search(r'name="description" content="([^"]*)"', text)
    if m2:
        print('Desc:', repr(m2.group(1)[:100]))
except Exception as e:
    print('Error:', e)

# 檢查 source index.html
print('\n--- source index.html ---')
with open('.tmp_src/index.html', 'rb') as f:
    raw2 = f.read()
print('Length:', len(raw2))
try:
    text2 = raw2.decode('utf-8')
    print('UTF-8 OK')
    m = re.search(r'<title>([^<]*)</title>', text2)
    if m:
        print('Title:', repr(m.group(1)))
    m2 = re.search(r'name="description" content="([^"]*)"', text2)
    if m2:
        print('Desc:', repr(m2.group(1)[:100]))
except Exception as e:
    print('Error:', e)
