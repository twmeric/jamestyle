import os
import re

print('=== Root files ===')
for f in sorted(os.listdir('.')):
    path = os.path.join('.', f)
    if os.path.isfile(path):
        print(f'  {f} ({os.path.getsize(path)} bytes)')

print('\n=== assets ===')
for f in sorted(os.listdir('assets')):
    path = os.path.join('assets', f)
    print(f'  {f} ({os.path.getsize(path)} bytes)')

print('\n=== images ===')
for f in sorted(os.listdir('images')):
    path = os.path.join('images', f)
    if os.path.isfile(path):
        print(f'  {f} ({os.path.getsize(path)} bytes)')

print('\n=== index.html refs ===')
with open('index.html', 'rb') as f:
    text = f.read().decode('utf-8')
for m in re.finditer(r'(src|href)="([^"]+)"', text):
    print(f'  {m.group(1)} -> {m.group(2)}')
