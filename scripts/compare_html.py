import urllib.request

# Fetch both versions
for url in ['https://jamestyle.com', 'https://de166645.jamestyle.pages.dev']:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
    print(f'\n=== {url} ({len(data)} bytes) ===')
    text = data.decode('utf-8', errors='replace')
    print(text[:500])
    print('...')
    print(text[-300:])
