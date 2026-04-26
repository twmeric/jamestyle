import os
import shutil
import subprocess

OLD_URL = b'https://staging--s2e5z29vo0frkh4hwx97.youbase.cloud'
NEW_URL = b'https://jamestyle-analytics.jimsbond007.workers.dev'
BUILD_DIR = 'dist'
DEPLOY_DIR = r'E:\projects\JameStyle'

# Replace URL in JS bundle
for root, dirs, files in os.walk(BUILD_DIR):
    for f in files:
        if f.endswith(('.js', '.html', '.css')):
            path = os.path.join(root, f)
            with open(path, 'rb') as file:
                data = file.read()
            count = data.count(OLD_URL)
            if count:
                data = data.replace(OLD_URL, NEW_URL)
                with open(path, 'wb') as file:
                    file.write(data)
                print(f'Replaced {count} URLs in {path}')

# Clean deploy dir
if os.path.exists('.deploy_tmp'):
    shutil.rmtree('.deploy_tmp')
os.makedirs('.deploy_tmp')

# Copy needed files
for item in ['index.html', 'logo.png', 'naikaifont-lite.woff2', 'naikaifont-subset.woff2', 'yw_manifest.json']:
    src = os.path.join(DEPLOY_DIR, item)
    if os.path.exists(src):
        shutil.copy2(src, '.deploy_tmp')

# Copy dirs
for d in ['assets', 'images']:
    src = os.path.join(DEPLOY_DIR, d)
    if os.path.exists(src):
        shutil.copytree(src, os.path.join('.deploy_tmp', d))

# Remove old root files that shouldn't be deployed
for f in os.listdir(DEPLOY_DIR):
    if f in ['index.html', 'logo.png', 'naikaifont-lite.woff2', 'naikaifont-subset.woff2', 'yw_manifest.json']:
        os.remove(os.path.join(DEPLOY_DIR, f))

# Copy new build files
for item in os.listdir(BUILD_DIR):
    src = os.path.join(BUILD_DIR, item)
    dst = os.path.join(DEPLOY_DIR, item)
    if os.path.isfile(src):
        shutil.copy2(src, dst)
    else:
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst)

# Also copy to deploy_tmp for wrangler
for item in os.listdir(BUILD_DIR):
    src = os.path.join(BUILD_DIR, item)
    dst = os.path.join('.deploy_tmp', item)
    if os.path.isfile(src):
        shutil.copy2(src, dst)
    else:
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst)

print('\nDeploy dir ready')

# Deploy
wrangler_cmd = os.path.join(os.getcwd(), '..', 'backend', 'node_modules', '.bin', 'wrangler.cmd')
result = subprocess.run(
    [wrangler_cmd, 'pages', 'deploy', '.deploy_tmp', '--project-name=jamestyle', '--branch=main'],
    capture_output=True, text=True, shell=True
)
print('STDOUT:', result.stdout)
print('STDERR:', result.stderr)
print('Return code:', result.returncode)
