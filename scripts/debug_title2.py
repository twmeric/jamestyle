import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 重定向输出到文件
with open('debug_output.txt', 'w', encoding='utf-8') as out:
    start = content.find('<title>')
    end = content.find('</title>')
    if start >= 0 and end >= 0:
        title = content[start+7:end]
        out.write('Title: ' + repr(title) + '\n')
        out.write('Has replacement char: ' + str('\ufffd' in title) + '\n')
        out.write('Title length: ' + str(len(title)) + '\n')
        for i, c in enumerate(title):
            if c == '\ufffd' or ord(c) > 0xFFFF:
                out.write(f'  Char {i}: U+{ord(c):04X} (REPLACEMENT)\n')
            elif ord(c) > 127:
                out.write(f'  Char {i}: U+{ord(c):04X}\n')

    # 检查整个文件中的替换字符
    count = content.count('\ufffd')
    out.write(f'\nTotal replacement chars in file: {count}\n')
    
    # 找到所有替换字符的位置
    idx = 0
    while True:
        idx = content.find('\ufffd', idx)
        if idx < 0:
            break
        # 显示上下文
        ctx_start = max(0, idx - 30)
        ctx_end = min(len(content), idx + 30)
        ctx = content[ctx_start:ctx_end]
        out.write(f'  Position {idx}: ...{repr(ctx)}...\n')
        idx += 1

print('Output written to debug_output.txt')
