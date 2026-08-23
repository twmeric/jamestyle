import json
with open(r'E:\Projects\JameStyle\uploaded_images\ocr_all.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
print('Total:', len(data))
for item in data:
    print(f"{item['idx']}: {item['file'][:50]}")
    print(f"    -> {item['caption'][:100]}...")
