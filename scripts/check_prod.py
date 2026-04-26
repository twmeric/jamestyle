import urllib.request
import re

url = 'https://production.jamestyle.pages.dev'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
        print(f'Status: {resp.status}')
        print(f'Size: {len(data)} bytes')
        print(f'First 200 bytes: {data[:200]}')
        
        text = data.decode('utf-8', errors='replace')
        m = re.search(r'<title>([^<]*)</title>', text)
        if m:
            title = m.group(1)
            print(f'Title: {repr(title)}')
            print(f'Title chars:', [f'U+{ord(c):04X}' for c in title])
        
        # Check for old URL
        if b'youbase.cloud' in data:
            print('Contains OLD URL')
        if b'jamestyle-analytics' in data:
            print('Contains NEW URL')
except Exception as e:
    print(f'Error: {e}')
