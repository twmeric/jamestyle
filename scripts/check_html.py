import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

m = re.search(r'<title>([^<]*)</title>', content)
if m:
    title = m.group(1)
    print('Title repr:', repr(title))
    print('Title len:', len(title))
    print('Title chars:', [hex(ord(c)) for c in title[:20]])

m2 = re.search(r'charset=([^"\'\s]+)', content)
if m2:
    print('Charset:', m2.group(1))
