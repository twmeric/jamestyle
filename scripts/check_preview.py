import urllib.request

urls = [
    'https://de166645.jamestyle.pages.dev',
    'https://production.jamestyle.pages.dev',
]

for url in urls:
    print(f'\n=== {url} ===')
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            print(f'Status: {resp.status}')
            print(f'Size: {len(data)} bytes')
            
            text = data.decode('utf-8')
            import re
            m = re.search(r'<title>([^<]*)</title>', text)
            if m:
                title = m.group(1)
                print(f'Title chars:', [f'U+{ord(c):04X}' for c in title])
    except Exception as e:
        print(f'Error: {e}')
