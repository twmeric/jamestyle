import urllib.request

# Check production JS
js_url = 'https://jamestyle.com/assets/index-BzVQIH9z.js'
try:
    req = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        js_data = resp.read()
    print(f'Production JS size: {len(js_data)} bytes')
    print(f'Contains 深呼吸: {b"\xe6\xb7\xb1\xe5\x91\xbc\xe5\x90\xb8" in js_data}')
    print(f'Contains 煩惱已清空: {b"\xe7\x85\xa9\xe6\x82\xa9\xe5\xb7\xb2\xe6\xb8\x85\xe7\xa9\xba" in js_data}')
    print(f'Contains profile-04: {b"profile-04" in js_data}')
    print(f'Contains Breathe: {b"Breathe" in js_data}')
except Exception as e:
    print(f'Error: {e}')

# Check HTML
req2 = urllib.request.Request('https://jamestyle.com', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req2, timeout=15) as resp:
    html = resp.read()
print(f'\nHTML size: {len(html)}')
print(f'Refs new JS: {b"index-BzVQIH9z.js" in html}')
