import urllib.request
import re

url = 'https://jamestyle.com'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=15) as resp:
    html = resp.read()

text = html.decode('utf-8', errors='replace')
print('HTML size:', len(html))

for m in re.finditer(r'(src|href)="([^"]+)"', text):
    print(m.group(1), '->', m.group(2))
