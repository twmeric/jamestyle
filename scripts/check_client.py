import re

with open(r"E:\projects\JameStyle\.build_src\dist\assets\index-B83Ilir-.js", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

idx = content.find("createEdgeSpark")
print(content[idx:idx+800])
