import zipfile

zip_path = r"C:\Users\Owner\.kimi\sessions\893341e196bdf3507941dfe29f2095b7\fa26a565-7551-45ab-84be-ca2f589988b1\uploads\JameStyle SRC_45f17b.zip"

with zipfile.ZipFile(zip_path, 'r') as z:
    # 找到 JS 文件
    js_files = [n for n in z.namelist() if 'dist/assets/index-' in n and n.endswith('.js') and not n.endswith('.map')]
    print('JS files:', js_files)
    
    with z.open(js_files[0]) as f:
        raw = f.read()
    
    # 搜索 "阿占隨意" 的 UTF-8 字节
    target = '阿占隨意'.encode('utf-8')
    idx = raw.find(target)
    print(f'Found 阿占隨意 at byte {idx}')
    
    # 搜索 "隨意，但不隨便"
    target2 = '隨意，但不隨便'.encode('utf-8')
    idx2 = raw.find(target2)
    print(f'Found 隨意，但不隨便 at byte {idx2}')
    
    # 搜索 "大便"
    target3 = '大便'.encode('utf-8')
    idx3 = raw.find(target3)
    print(f'Found 大便 at byte {idx3}')
