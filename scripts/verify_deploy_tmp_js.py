with open('.deploy_tmp/assets/index-BzVQIH9z.js', 'rb') as f:
    data = f.read()

print('JS size:', len(data))
print('Contains 深呼吸:', b'\xe6\xb7\xb1\xe5\x91\xbc\xe5\x90\xb8' in data)
print('Contains 煩惱已清空:', b'\xe7\x85\xa9\xe6\x82\xa9\xe5\xb7\xb2\xe6\xb8\x85\xe7\xa9\xba' in data)
print('Contains profile-04:', b'profile-04' in data)
print('Contains Breathe:', b'Breathe' in data)

# Search for old strings
print('Contains index-DD7y3Elx:', b'index-DD7y3Elx' in data)
