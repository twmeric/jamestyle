import os
import shutil

# Clean .deploy_tmp
if os.path.exists('.deploy_tmp'):
    shutil.rmtree('.deploy_tmp')
os.makedirs('.deploy_tmp')

# Copy from fresh dist
for item in os.listdir('.build_src/dist'):
    src = os.path.join('.build_src/dist', item)
    dst = os.path.join('.deploy_tmp', item)
    if os.path.isfile(src):
        shutil.copy2(src, dst)
    else:
        shutil.copytree(src, dst)

print('Deploy tmp contents:')
for f in sorted(os.listdir('.deploy_tmp/assets')):
    print(f'  assets/{f}')

with open('.deploy_tmp/index.html', 'rb') as f:
    text = f.read().decode('utf-8')
import re
for m in re.finditer(r'(src|href)="([^"]+)"', text):
    print(f'  html: {m.group(1)} -> {m.group(2)}')
