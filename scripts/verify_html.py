import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

print('Length:', len(content))
print('Has replacement char:', '\ufffd' in content)

m = re.search(r'<title>([^<]*)</title>', content)
if m:
    print('Title:', repr(m.group(1)))

m2 = re.search(r'name="description" content="([^"]*)"', content)
if m2:
    print('Desc:', repr(m2.group(1)[:100]))
