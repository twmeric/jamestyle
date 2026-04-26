import urllib.request

url = 'https://jamestyle.com'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
        print(f'Status: {resp.status}')
        print(f'Content-Type: {resp.headers.get("Content-Type")}')
        print(f'Size: {len(data)} bytes')
        
        # Check encoding
        text = data.decode('utf-8')
        import re
        m = re.search(r'<title>([^<]*)</title>', text)
        if m:
            title = m.group(1)
            print(f'Title bytes: {title.encode("utf-8")}')
            print('Title chars:')
            for c in title:
                print(f'  U+{ord(c):04X}')
except Exception as e:
    print(f'Error: {e}')
