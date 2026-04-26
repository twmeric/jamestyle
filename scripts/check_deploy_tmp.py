import re

with open('.deploy_tmp/index.html', 'rb') as f:
    text = f.read().decode('utf-8')

for m in re.finditer(r'(src|href)="([^"]+)"', text):
    print(m.group(1), '->', m.group(2))
