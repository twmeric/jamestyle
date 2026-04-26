import re

with open(r"E:\projects\JameStyle\.build_src\dist\assets\index-B83Ilir-.js", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

for s in ["jamestyle-analytics", "baseUrl", "api.fetch"]:
    idx = content.find(s)
    if idx >= 0:
        print(f"FOUND {s} at {idx}")
        print(content[idx:idx+300])
        print("---")
