import urllib.request

req = urllib.request.Request('https://jamestyle.com/assets/index-BzVQIH9z.js', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=15) as resp:
    data = resp.read()

print('Status:', resp.status)
print('Size:', len(data))
print('Contains 深呼吸:', b'\xe6\xb7\xb1\xe5\x91\xbc\xe5\x90\xb8' in data)
print('Contains Breathe:', b'Breathe' in data)
print('Contains profile-04:', b'profile-04' in data)
