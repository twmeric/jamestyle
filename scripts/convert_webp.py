from PIL import Image
import os
import glob

jpeg_dir = '.build_src/public/gallery-images'
webp_dir = '.build_src/public/gallery-images-webp'

if not os.path.exists(webp_dir):
    os.makedirs(webp_dir)

jpeg_files = sorted(glob.glob(os.path.join(jpeg_dir, '*.jpeg')))
print(f'Found {len(jpeg_files)} JPEG files')

converted = 0
total_jpeg = 0
total_webp = 0

for jpeg_path in jpeg_files:
    basename = os.path.basename(jpeg_path)
    name = os.path.splitext(basename)[0]
    webp_path = os.path.join(webp_dir, f'{name}.webp')
    
    try:
        img = Image.open(jpeg_path)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        img.save(webp_path, 'WEBP', quality=80, method=6)
        converted += 1
        jpeg_size = os.path.getsize(jpeg_path)
        webp_size = os.path.getsize(webp_path)
        total_jpeg += jpeg_size
        total_webp += webp_size
        ratio = (1 - webp_size/jpeg_size) * 100
        if converted <= 5 or converted == len(jpeg_files):
            print(f'{basename}: {jpeg_size//1024}KB -> {webp_size//1024}KB ({ratio:.1f}% smaller)')
        elif converted == 6:
            print('...')
    except Exception as e:
        print(f'Error converting {basename}: {e}')

print(f'\nConverted {converted}/{len(jpeg_files)} images to WebP')
print(f'Total JPEG: {total_jpeg//1024} KB')
print(f'Total WebP: {total_webp//1024} KB')
print(f'Space saved: {(1-total_webp/total_jpeg)*100:.1f}%')
