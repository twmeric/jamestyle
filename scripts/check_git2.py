import subprocess
import re

result = subprocess.run(['git', 'show', '91e75a4:index.html'], capture_output=True)
raw = result.stdout

# 查看位置 203 附近的字節
start = max(0, 203 - 30)
end = min(len(raw), 203 + 50)
snippet = raw[start:end]
print('Bytes around pos 203:', ' '.join(f'{b:02x}' for b in snippet))
print()

# 嘗試 latin-1 解碼整個文件
text = raw.decode('latin-1')
print('Latin-1 decode OK, length:', len(text))

m = re.search(r'<title>([^<]*)</title>', text)
if m:
    print('Title:', repr(m.group(1)))

m2 = re.search(r'name="description" content="([^"]*)"', text)
if m2:
    print('Desc:', repr(m2.group(1)[:120]))

# 找到所有 >= 0x80 的字節位置
high_bytes = [(i, raw[i]) for i in range(len(raw)) if raw[i] >= 0x80]
print('\nHigh byte count:', len(high_bytes))
print('First 20 high bytes:', [(i, f'{b:02x}') for i, b in high_bytes[:20]])
