import os
import json
from rapidocr_onnxruntime import RapidOCR
from PIL import Image

src_dir = r'E:\Projects\JameStyle\uploaded_images\Jamestyle Original'
out_file = r'E:\Projects\JameStyle\uploaded_images\ocr_all.json'
engine = RapidOCR()

done_names = set()
for i in range(1, 31):
    done_names.add(f'{i:02d}.jpeg' if i < 10 else f'{i:03d}.jpeg')

size_map = {}
for name in done_names:
    path = os.path.join(src_dir, name)
    if os.path.exists(path):
        size_map[os.path.getsize(path)] = name

remaining = sorted([f for f in os.listdir(src_dir) if f not in done_names])
new_files = []
for name in remaining:
    path = os.path.join(src_dir, name)
    size = os.path.getsize(path)
    if size in size_map:
        try:
            img1 = Image.open(path)
            img2 = Image.open(os.path.join(src_dir, size_map[size]))
            if img1.size == img2.size:
                r1 = img1.convert('L').resize((16, 16))
                r2 = img2.convert('L').resize((16, 16))
                diff = sum(abs(p1 - p2) for p1, p2 in zip(r1.getdata(), r2.getdata()))
                if diff < 100:
                    continue
        except:
            pass
    new_files.append(name)

print(f'Total new files: {len(new_files)}')

# Load existing progress
results = []
if os.path.exists(out_file):
    try:
        with open(out_file, 'r', encoding='utf-8') as f:
            results = json.load(f)
        print(f'Loaded existing progress: {len(results)} results')
    except:
        pass

processed_files = {r['file'] for r in results}

for i, name in enumerate(new_files, 31):
    if name in processed_files:
        continue
    path = os.path.join(src_dir, name)
    try:
        result, _ = engine(path)
        texts = [r[1] for r in result] if result else []
        caption = ' '.join(texts)
        caption = caption.replace('JAMESTYLE', '').replace('jamesstyle', '').replace('James style', '').replace('james style', '').replace('DC', '').strip()
        results.append({'idx': i, 'file': name, 'caption': caption})
        print(f'{i}: {name} -> {caption[:60]}...')
    except Exception as e:
        results.append({'idx': i, 'file': name, 'caption': '', 'error': str(e)})
        print(f'{i}: {name} -> ERROR')
    # Save after each image
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

print(f'\nDone! {len(results)} images OCR saved')
