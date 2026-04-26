import urllib.request

# Check production
js_url = 'https://jamestyle.com/assets/index-DD7y3Elx.js'
try:
    req = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        js_data = resp.read()
    print(f'Production JS size: {len(js_data)} bytes')
    print(f'Contains 吸氣: {b"\xe5\x90\xb8\xe6\xb0\xa3" in js_data}')
    print(f'Contains profile-04: {b"profile-04" in js_data}')
except Exception as e:
    print(f'Error: {e}')

# Also check if old JS still exists
old_js = 'https://jamestyle.com/assets/index-Dvbk-C6d.js'
try:
    req = urllib.request.Request(old_js, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
    print(f'\nOld JS still accessible: {len(data)} bytes')
except Exception as e:
    print(f'\nOld JS not found: {e}')
