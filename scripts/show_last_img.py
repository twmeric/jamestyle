import os
import glob

files = glob.glob('.tmp_profile/JamesProfile/*.jpeg')
# 找最大的文件
last_file = max(files, key=os.path.getsize)
print(f'File: {last_file!r}')
print(f'Size: {os.path.getsize(last_file)}')
