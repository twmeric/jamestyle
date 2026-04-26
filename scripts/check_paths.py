import re

with open('index.html', 'rb') as f:
    text = f.read().decode('utf-8')

for m in re.finditer(r'(src|href)="([^"]+)"', text):
    print(m.group(1), '->', m.group(2))
