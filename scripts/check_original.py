import sys, re
content = sys.stdin.read()
m = re.search(r'<title>([^<]*)</title>', content)
if m:
    print('Original title:', repr(m.group(1)))
m2 = re.search(r'name="description" content="([^"]*)"', content)
if m2:
    print('Original desc:', repr(m2.group(1)))
