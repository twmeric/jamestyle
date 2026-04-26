with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

print('File length:', len(content))
print('First 200 chars:', repr(content[:200]))
print('')
print('Contains <title>:', '<title>' in content)
print('Contains James:', 'James' in content)

# Check for BOM
with open('index.html', 'rb') as f:
    raw = f.read()
print('First 5 bytes:', raw[:5])
print('Has BOM:', raw[:3] == b'\xef\xbb\xbf')
