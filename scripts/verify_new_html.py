import re

with open('index.html', 'rb') as f:
    raw = f.read()

print('Size:', len(raw))
print('First 20 bytes:', ' '.join(f'{b:02x}' for b in raw[:20]))

text = raw.decode('utf-8')
print('UTF-8 decode OK')

m = re.search(r'<title>([^<]*)</title>', text)
if m:
    title = m.group(1)
    print('\nTitle:', repr(title))
    print('Title chars:')
    for c in title:
        print(f'  U+{ord(c):04X} = {c}')

m2 = re.search(r'name="description" content="([^"]*)"', text)
if m2:
    desc = m2.group(1)
    print('\nDesc:', repr(desc))
    print('Desc chars:')
    for c in desc:
        print(f'  U+{ord(c):04X} = {c}')
