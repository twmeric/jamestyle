import zipfile
import os

# 清空並重建臨時目錄
os.makedirs('.tmp_src', exist_ok=True)

zip_path = r"C:\Users\Owner\.kimi\sessions\893341e196bdf3507941dfe29f2095b7\fa26a565-7551-45ab-84be-ca2f589988b1\uploads\JameStyle SRC_45f17b.zip"
print(f"Extracting: {zip_path}")
print(f"Exists: {os.path.exists(zip_path)}")

with zipfile.ZipFile(zip_path, 'r') as z:
    print(f"Files in zip: {len(z.namelist())}")
    for name in z.namelist()[:10]:
        print(f"  {name}")
    z.extractall('.tmp_src')

print("Done")
