import urllib.request
import re

url = 'https://jamestyle.com'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
        print(f'Status: {resp.status}')
        print(f'Size: {len(data)} bytes')
        
        text = data.decode('utf-8', errors='replace')
        m = re.search(r'<title>([^<]*)</title>', text)
        if m:
            title = m.group(1)
            print(f'Title: {repr(title)}')
            print('Title chars:', [f'U+{ord(c):04X}={c}' for c in title])
        
        # Check referenced JS
        js_match = re.search(r'src="(/assets/[^"]+)"', text)
        if js_match:
            js_path = js_match.group(1)
            print(f'JS path: {js_path}')
            
            js_url = 'https://jamestyle.com' + js_path
            req2 = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req2, timeout=15) as resp2:
                js_data = resp2.read()
                print(f'JS size: {len(js_data)}')
                print(f'JS has old URL: {b"youbase.cloud" in js_data}')
                print(f'JS has new URL: {b"jamestyle-analytics" in js_data}')
except Exception as e:
    print(f'Error: {e}')
