import urllib.request

# Check preview URL
base = 'https://341993ae.jamestyle.pages.dev'

# Check JS bundle for new code
js_url = base + '/assets/index-DD7y3Elx.js'
req = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=15) as resp:
    js_data = resp.read()

print(f'JS size: {len(js_data)} bytes')
print(f'Contains HealingIntro: {b"HealingIntro" in js_data}')
print(f'Contains 煩惱: {b"\xe7\x85\xa9\xe6\x82\xa9" in js_data}')  # 煩惱 UTF-8
print(f'Contains 吸氣: {b"\xe5\x90\xb8\xe6\xb0\xa3" in js_data}')  # 吸氣 UTF-8
print(f'Contains 啵聲: {b"\xe5\x95\xb5" in js_data}')  # 啵 UTF-8
print(f'Contains profile-04: {b"profile-04" in js_data}')

# Check index.html
req2 = urllib.request.Request(base, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req2, timeout=15) as resp:
    html = resp.read()
print(f'\nHTML size: {len(html)} bytes')
print(f'HTML contains index-DD7y3Elx.js: {b"index-DD7y3Elx.js" in html}')
