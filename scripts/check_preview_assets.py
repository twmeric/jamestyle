import urllib.request

base = 'https://de166645.jamestyle.pages.dev'
paths = [
    '/',
    '/assets/index-Dvbk-C6d.js',
    '/assets/index-B8qb2YXd.css',
    '/images/01.jpeg',
    '/logo.png',
]

for p in paths:
    url = base + p
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f'{p}: {resp.status} ({len(resp.read())} bytes)')
    except Exception as e:
        print(f'{p}: ERROR - {e}')
