with open('assets/index-Dvbk-C6d.js', 'rb') as f:
    raw = f.read()

print('JS size:', len(raw))

# Check for old URL
old = b'youbase.cloud'
new = b'jamestyle-analytics.jimsbond007.workers.dev'
print(f'Contains old URL ({old.decode()}): {old in raw}')
print(f'Contains new URL ({new.decode()}): {new in raw}')

# Check for Chinese text
targets = ['隨意，但不隨便', '人生…就像大便一樣', '生活給了我一個巴掌']
for t in targets:
    enc = t.encode('utf-8')
    idx = raw.find(enc)
    print(f'Found "{t}": {idx >= 0}')
