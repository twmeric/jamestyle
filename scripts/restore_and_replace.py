import zipfile
import os
import shutil

zip_path = r"C:\Users\Owner\.kimi\sessions\893341e196bdf3507941dfe29f2095b7\fa26a565-7551-45ab-84be-ca2f589988b1\uploads\JameStyle SRC_45f17b.zip"
OLD_URL = b'https://staging--s2e5z29vo0frkh4hwx97.youbase.cloud'
NEW_URL = b'https://jamestyle-analytics.jimsbond007.workers.dev'

# Backup existing files
if os.path.exists('index.html.bak'):
    os.remove('index.html.bak')
if os.path.exists('index.html'):
    shutil.move('index.html', 'index.html.bak')

with zipfile.ZipFile(zip_path, 'r') as z:
    dist_files = [n for n in z.namelist() if n.startswith('dist/')]
    print(f'Found {len(dist_files)} files in dist/')
    
    for name in dist_files:
        # Skip directories
        if name.endswith('/'):
            continue
        
        # Target path: strip 'dist/' prefix
        target = name[5:]  # remove 'dist/'
        target_path = os.path.join(os.getcwd(), target)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        
        with z.open(name) as f:
            data = f.read()
        
        # Binary-safe URL replacement for HTML and JS files
        if target.endswith(('.html', '.js', '.css')):
            count = data.count(OLD_URL)
            if count:
                data = data.replace(OLD_URL, NEW_URL)
                print(f'  Replaced {count} URLs in {target}')
        
        with open(target_path, 'wb') as out:
            out.write(data)
        
        print(f'  Extracted: {target} ({len(data)} bytes)')

print('\nDone! Verifying index.html...')
with open('index.html', 'rb') as f:
    raw = f.read()
print(f'index.html size: {len(raw)} bytes')
print(f'Contains old URL: {OLD_URL in raw}')
print(f'Contains new URL: {NEW_URL in raw}')
