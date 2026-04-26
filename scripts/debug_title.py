with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 找到 title 标签
start = content.find('<title>')
end = content.find('</title>')
if start >= 0 and end >= 0:
    title = content[start+7:end]
    print('Title:', repr(title))
    print('Title bytes:', title.encode('utf-8'))
    print('Is valid utf-8:', True)
    
    # 检查是否有替换字符
    print('Has replacement char:', '\ufffd' in title)
    print('Has control chars:', any(ord(c) < 32 and c not in '\n\r\t' for c in title))

# 也检查 description
dstart = content.find('name="description" content="')
if dstart >= 0:
    dval_start = dstart + len('name="description" content="')
    dval_end = content.find('"', dval_start)
    desc = content[dval_start:dval_end]
    print('Desc:', repr(desc))
    print('Desc has replacement char:', '\ufffd' in desc)
