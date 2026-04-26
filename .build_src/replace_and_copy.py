import os
import shutil

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

# Clean old deploy files (keep backend, .git, etc.)
keep = {
    '.git', 'backend', '.gitignore', '.wrangler',
    'check_desc.py', 'check_git.py', 'check_git2.py', 'check_html.py',
    'check_js.py', 'check_original.py', 'check_tmp.py', 'check_app.py',
    'check_dist.py', 'check_dist_js.py', 'check_jamestyle.py', 'check_live.py',
    'check_live_js.py', 'check_paths.py', 'check_preview.py', 'check_preview_assets.py',
    'check_prod.py', 'compare_html.py', 'copy_last.py', 'debug_html.py', 'debug_title.py',
    'debug_title2.py', 'decode_index.py', 'deploy_clean.py', 'deploy_clean2.py',
    'detect_encoding.py', 'dump_slides.py', 'extract_zip.py', 'read_zip_direct.py',
    'restore_and_replace.py', 'show_last_img.py', 'slides_dump.ts', 'opening_dump.tsx',
    'verify_html.py', 'verify_js.py', 'verify_new_html.py', 'index.html.bak',
    'index.html.git', 'last_img.jpeg', '.tmp_src', '.tmp_profile', '.build_src',
    '.deploy_tmp', 'naikaifont-lite.woff2', 'naikaifont-subset.woff2', 'logo.png',
    'yw_manifest.json'
}

for item in os.listdir(DEPLOY_DIR):
    if item in keep:
        continue
    path = os.path.join(DEPLOY_DIR, item)
    if os.path.isfile(path):
        os.remove(path)
    elif os.path.isdir(path):
        shutil.rmtree(path)
    print(f'Removed: {item}')

# Copy new dist files
for item in os.listdir(BUILD_DIR):
    src = os.path.join(BUILD_DIR, item)
    dst = os.path.join(DEPLOY_DIR, item)
    if os.path.isfile(src):
        shutil.copy2(src, dst)
    else:
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
    print(f'Copied: {item}')

print('\nDone!')
