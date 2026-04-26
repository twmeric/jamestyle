import urllib.request
import re

# Check the JS file referenced in index.html
url = 'https://jamestyle.com/assets/index-Dvbk-C6d.js'
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
        print(f'Status: {resp.status}')
        print(f'Size: {len(data)} bytes')
        
        old = b'youbase.cloud'
        new = b'jamestyle-analytics.jimsbond007.workers.dev'
        print(f'Contains old URL: {old in data}')
        print(f'Contains new URL: {new in data}')
        
        # Find occurrences
        count_new = data.count(new)
        print(f'New URL count: {count_new}')
        
        # Check for EdgeSpark auth URL pattern
        es_patterns = [b'_es/config', b'edge', b'EdgeSpark']
        for p in es_patterns:
            if p in data:
                print(f'Contains {p.decode()}: True')
except Exception as e:
    print(f'Error: {e}')
