import os
import shutil
import subprocess
import sys

# Clean deploy temp dir
deploy_dir = '.deploy_tmp'
if os.path.exists(deploy_dir):
    shutil.rmtree(deploy_dir)
os.makedirs(deploy_dir)

files_to_copy = [
    'index.html',
    'logo.png',
    'naikaifont-lite.woff2',
    'naikaifont-subset.woff2',
    'yw_manifest.json',
]

dirs_to_copy = [
    'assets',
    'images',
]

for f in files_to_copy:
    if os.path.exists(f):
        shutil.copy2(f, deploy_dir)
        print(f'Copied: {f}')
    else:
        print(f'MISSING: {f}')

for d in dirs_to_copy:
    if os.path.exists(d):
        shutil.copytree(d, os.path.join(deploy_dir, d))
        print(f'Copied dir: {d}')
    else:
        print(f'MISSING dir: {d}')

# Use wrangler from backend
wrangler_cmd = os.path.join(os.getcwd(), 'backend', 'node_modules', '.bin', 'wrangler.cmd')
if not os.path.exists(wrangler_cmd):
    # Try npx
    wrangler_cmd = 'npx'
    args = ['wrangler', 'pages', 'deploy', deploy_dir, '--project-name=jamestyle', '--branch=main']
else:
    args = [wrangler_cmd, 'pages', 'deploy', deploy_dir, '--project-name=jamestyle', '--branch=main']

print(f'\nRunning: {wrangler_cmd} {" ".join(args[1:] if wrangler_cmd != "npx" else args)}')
result = subprocess.run(args, capture_output=True, text=True, shell=True)
print('STDOUT:', result.stdout)
print('STDERR:', result.stderr)
print('Return code:', result.returncode)
