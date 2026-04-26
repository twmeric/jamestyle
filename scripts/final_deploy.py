import os
import shutil
import subprocess

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

for d in dirs_to_copy:
    if os.path.exists(d):
        shutil.copytree(d, os.path.join(deploy_dir, d))
        print(f'Copied dir: {d}')

print('\nDeploy dir contents:')
for root, dirs, files in os.walk(deploy_dir):
    level = root.replace(deploy_dir, '').count(os.sep)
    indent = ' ' * 2 * level
    print(f'{indent}{os.path.basename(root)}/')
    subindent = ' ' * 2 * (level + 1)
    for file in files:
        path = os.path.join(root, file)
        print(f'{subindent}{file} ({os.path.getsize(path)} bytes)')

# Deploy
wrangler_cmd = os.path.join(os.getcwd(), 'backend', 'node_modules', '.bin', 'wrangler.cmd')
print(f'\nDeploying with {wrangler_cmd}...')
result = subprocess.run(
    [wrangler_cmd, 'pages', 'deploy', deploy_dir, '--project-name=jamestyle', '--branch=main'],
    capture_output=True, text=True, shell=True
)
print('STDOUT:', result.stdout)
print('STDERR:', result.stderr)
print('Return code:', result.returncode)
