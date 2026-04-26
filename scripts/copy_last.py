import glob
import os

files = glob.glob('.tmp_profile/JamesProfile/*.jpeg')
last_file = max(files, key=os.path.getsize)

with open(last_file, 'rb') as f:
    data = f.read()

with open('last_img.jpeg', 'wb') as f:
    f.write(data)

print(f'Copied {len(data)} bytes')
