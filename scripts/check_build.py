import re

with open(r"E:\projects\JameStyle\.build_src\dist\assets\index-B83Ilir-.js", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

for s in ['device-metrics', 'analytics/device', 'mobile-metrics', 'analytics/mobile']:
    if s in content:
        print(f"FOUND: {s}")
    else:
        print(f"MISSING: {s}")

# Check what fetch returns
matches = re.findall(r'api\.fetch\(["\']([^"\']+)["\']', content)
for m in matches[:20]:
    print(f"API: {m}")
