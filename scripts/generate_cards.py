#!/usr/bin/env python3
"""
Generate 15 JameStyle quote cards (1080x1080) with realistic postmark stamp.
All stamp text is horizontal (parallel), entire stamp rotates 40°.
"""

import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from datetime import datetime

CANVAS_W = 1080
CANVAS_H = 1080
BG_COLOR = (250, 248, 243)
FRAME_COLOR = (255, 255, 255)
GOLD_COLOR = (196, 149, 106)
TEXT_COLOR = (90, 82, 72)
INK_COLOR = (74, 74, 74)
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output_cards")

SLIDES = [
    {"id": 1, "img": "01.jpeg", "tc": "人生…就像大便一樣，有軟有硬，有順有不順！"},
    {"id": 2, "img": "02.jpg", "tc": "生活給了我一個巴掌，但我出剪刀！"},
    {"id": 3, "img": "03.jpg", "tc": "現代人怕錯過訊息，從口袋掏出手機的速度，往往比拔鎗更快！"},
    {"id": 4, "img": "04.jpeg", "tc": "即使有一千個理由讓你哭，也要找一個理由令自己笑！"},
    {"id": 5, "img": "05.jpg", "tc": "保持快樂的秘訣，其實只是五個字～不要太用力！"},
    {"id": 6, "img": "06.jpg", "tc": "能讓別人快樂的人一定很善良，能讓自己快樂的人一定很聰明！"},
    {"id": 7, "img": "07.jpeg", "tc": "每個人都會摸到爛牌，把手上的爛牌打好，是生命裡唯一能做的事！"},
    {"id": 8, "img": "08.jpeg", "tc": "學會隻眼開隻眼閉，你可以輕鬆面對身處高峰或谷底！"},
    {"id": 9, "img": "09.jpg", "tc": "與其在別人的劇本裡客串路人甲，不如在自己的戲中擔當主角！"},
    {"id": 10, "img": "10.jpeg", "tc": "人生就是用你僅有的一二分甜，去沖淡八九分的苦！"},
    {"id": 11, "img": "11.jpeg", "tc": "人生不過三萬天，何不暢飲醉百年！"},
    {"id": 12, "img": "12.jpeg", "tc": "愛情同燒味飯一樣，全部都係整定！"},
    {"id": 13, "img": "13.jpeg", "tc": "我能百分之九十七的確定你不喜歡我，但我百分之百肯定我不在乎！"},
    {"id": 14, "img": "14.jpeg", "tc": "你不為別人擋風遮雨，誰會把你舉在頭上！"},
    {"id": 15, "img": "15.jpg", "tc": "可怕的不是練出一萬招的敵人，而是一招練一萬次的對手！"},
]

R2_NAMES = [
    "x7k9m2p4.png", "q3w8e5r1.png", "b6n4v2c8.png", "n9m5k3j7.png", "h2g4f6d8.png",
    "p5o7i9u1.png", "y3t5r7e9.png", "w2q4s6u8.png", "a1s3d5f7.png", "g4h6j8k0.png",
    "l2z4x6c8.png", "v1b3n5m7.png", "k9j7h5g3.png", "f2d4s6a8.png", "e1r3t5y7.png",
]

def get_font(name=None, size=24):
    paths = {
        "cn": [
            "C:/Windows/Fonts/kaiu.ttf",
            "C:/Windows/Fonts/mingliu.ttc",
            "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
            "/System/Library/Fonts/PingFang.ttc",
        ],
        "Calibri": [
            "C:/Windows/Fonts/calibrib.ttf",
            "C:/Windows/Fonts/calibri.ttf",
        ],
        "Georgia": [
            "C:/Windows/Fonts/georgia.ttf",
        ],
        "Arial": [
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/arial.ttf",
        ],
    }
    font_paths = paths.get(name, paths["cn"])
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except:
                pass
    return ImageFont.load_default()

def wrap_text(draw, text, font, max_width):
    # Split by punctuation to get natural segments (prioritize breaking at punctuation)
    import re
    segments = re.split(r'([，。！？；：、])', text)
    parts = []
    for i in range(0, len(segments), 2):
        word = segments[i]
        punct = segments[i + 1] if i + 1 < len(segments) else ""
        if word or punct:
            parts.append(word + punct)

    lines, cur = [], ""
    for part in parts:
        test = cur + part
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] > max_width and len(cur) > 0:
            lines.append(cur)
            cur = part
        else:
            cur = test
    if cur:
        lines.append(cur)

    # Fallback: character-level wrap for any line that still exceeds max_width
    result = []
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        if bbox[2] - bbox[0] > max_width:
            sub_lines, sub_cur = [], ""
            for ch in line:
                test = sub_cur + ch
                bbox = draw.textbbox((0, 0), test, font=font)
                if bbox[2] - bbox[0] > max_width and len(sub_cur) > 0:
                    sub_lines.append(sub_cur)
                    sub_cur = ch
                else:
                    sub_cur = test
            if sub_cur:
                sub_lines.append(sub_cur)
            result.extend(sub_lines)
        else:
            result.append(line)
    return result

def draw_postmark_stamp(radius, rotate=40):
    """
    Realistic circular postmark stamp.
    Layout (all text horizontal/parallel inside the stamp):
        ┌──────────────┐
        │  26/4/2026   │   ← top, horizontal
        │ ════════════ │   ← ribbon top line
        │  JAMESTYLE   │   ← center, biggest
        │ ════════════ │   ← ribbon bottom line
        │  阿占隨意    │   ← bottom, horizontal
        └──────────────┘
    Entire stamp rotates as one unit.
    """
    pad = 30
    size = radius * 2 + pad * 2
    stamp = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(stamp)
    cx, cy = size // 2, size // 2
    ink = (*INK_COLOR, 220)

    # Outer thick ring
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], outline=ink, width=5)
    # Inner thin ring
    draw.ellipse([cx - radius + 6, cy - radius + 6, cx + radius - 6, cy + radius - 6], outline=(*INK_COLOR, 120), width=1)

    # Ribbon band (two horizontal lines across the circle)
    band_half_h = max(20, radius // 3)
    line_len = int(radius * 1.5)
    band_y1 = cy - band_half_h
    band_y2 = cy + band_half_h
    draw.line([(cx - line_len // 2, band_y1), (cx + line_len // 2, band_y1)], fill=ink, width=4)
    draw.line([(cx - line_len // 2, band_y2), (cx + line_len // 2, band_y2)], fill=ink, width=4)

    # Main text in ribbon: JAMESTYLE
    font_main = get_font("Arial", size=24)
    bbox = draw.textbbox((0, 0), "JAMESTYLE", font=font_main)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((cx - tw // 2, cy - th // 2), "JAMESTYLE", font=font_main, fill=ink)

    # Top text: date (horizontal, above ribbon) — dynamic today
    stamp_date = datetime.now().strftime("%d/%m/%Y")
    font_date = get_font(size=max(18, radius // 4))
    bbox = draw.textbbox((0, 0), stamp_date, font=font_date)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    top_y = band_y1 - th - 6
    draw.text((cx - tw // 2, top_y), stamp_date, font=font_date, fill=ink)

    # Bottom text: 阿占隨意 (horizontal, below ribbon)
    font_author = get_font(size=max(18, radius // 4))
    bbox = draw.textbbox((0, 0), "阿占隨意", font=font_author)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    bottom_y = band_y2 + 10
    draw.text((cx - tw // 2, bottom_y), "阿占隨意", font=font_author, fill=ink)

    return stamp.rotate(rotate, expand=True, resample=Image.BICUBIC)

def generate_card(slide, output_path):
    canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), BG_COLOR)
    draw = ImageDraw.Draw(canvas)

    img_path = os.path.join(os.path.dirname(__file__), "..", ".build_src", "public", "images", slide["img"])
    src_img = None
    if os.path.exists(img_path):
        src_img = Image.open(img_path).convert("RGB")

    # Larger image (stamp overlaps edge, no bottom stamp space needed)
    available_h = CANVAS_H - 60 - 220 - 80
    max_img_w = CANVAS_W - 80
    max_img_h = available_h

    if src_img:
        aspect = src_img.width / src_img.height
        img_w = min(max_img_w, int(max_img_h * aspect))
        img_h = min(max_img_h, int(max_img_w / aspect))
        if img_w > max_img_w:
            img_w = max_img_w
            img_h = int(img_w / aspect)
        if img_h > max_img_h:
            img_h = max_img_h
            img_w = int(img_h * aspect)
    else:
        img_w, img_h = max_img_w, max_img_h

    # Frame
    frame_pad = 12
    frame_x = (CANVAS_W - img_w) // 2 - frame_pad
    frame_y = 60 - frame_pad
    frame_w = img_w + frame_pad * 2
    frame_h = img_h + frame_pad * 2

    # Shadow
    shadow = Image.new("RGBA", (frame_w + 8, frame_h + 8), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rectangle([4, 4, frame_w + 4, frame_h + 4], fill=(0, 0, 0, 25))
    canvas.paste(shadow.filter(ImageFilter.GaussianBlur(8)), (frame_x - 4, frame_y - 4), shadow)

    # White frame
    draw.rectangle([frame_x, frame_y, frame_x + frame_w, frame_y + frame_h], fill=FRAME_COLOR)
    draw.rectangle(
        [frame_x + frame_pad - 1, frame_y + frame_pad - 1,
         frame_x + frame_w - frame_pad + 1, frame_y + frame_h - frame_pad + 1],
        outline=GOLD_COLOR, width=1
    )

    # Paste image
    img_x = frame_x + frame_pad
    img_y = frame_y + frame_pad
    if src_img:
        canvas.paste(src_img.resize((img_w, img_h), Image.LANCZOS), (img_x, img_y))

    # === POSTMARK STAMP overlapping frame edge ===
    stamp_r = 80
    stamp = draw_postmark_stamp(stamp_r, rotate=40)
    # Position: ~1/3 outside the frame, ~2/3 inside the frame
    stamp_cx = frame_x + frame_w - stamp_r * 2 // 3
    stamp_cy = frame_y + frame_h - stamp_r * 2 // 3
    sx = stamp_cx - stamp.width // 2
    sy = stamp_cy - stamp.height // 2
    canvas.paste(stamp, (sx, sy), stamp)

    # Quote
    quote_y = frame_y + frame_h + 35
    max_text_w = CANVAS_W - 140
    caption = slide["tc"]

    font_sizes = [60, 52, 46, 40, 34]
    chosen_font, chosen_lines, chosen_size = None, [], 34
    for size in font_sizes:
        font = get_font(size=size)
        lines = wrap_text(draw, caption, font, max_text_w)
        line_h = size + 12
        total_h = len(lines) * line_h
        available_quote_h = CANVAS_H - quote_y - 80
        if total_h <= available_quote_h or size == 34:
            chosen_font, chosen_lines, chosen_size = font, lines, size
            if total_h <= available_quote_h:
                break

    line_h = chosen_size + 12
    for i, line in enumerate(chosen_lines):
        bbox = draw.textbbox((0, 0), line, font=chosen_font)
        tw = bbox[2] - bbox[0]
        draw.text(((CANVAS_W - tw) // 2, quote_y + i * line_h), line, font=chosen_font, fill=TEXT_COLOR)

    # Footer (Calibri Bold for English brand text)
    footer_font = get_font("Calibri", 30)
    bbox = draw.textbbox((0, 0), "JameStyle.com", font=footer_font)
    tw = bbox[2] - bbox[0]
    draw.text(((CANVAS_W - tw) // 2, CANVAS_H - 50), "JameStyle.com", font=footer_font, fill=TEXT_COLOR)

    canvas.save(output_path, "PNG")
    print(f"  Saved: {output_path}")

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Generating 15 cards to {OUTPUT_DIR}...")

    for slide in SLIDES:
        output_name = f"slide_{slide['id']:02d}.png"
        output_path = os.path.join(OUTPUT_DIR, output_name)
        print(f"Generating card {slide['id']}...")
        generate_card(slide, output_path)

    print("\nDone! Upload mapping:")
    for slide, r2_name in zip(SLIDES, R2_NAMES):
        fname = f"slide_{slide['id']:02d}.png"
        print(f"  {fname} -> {r2_name}")

if __name__ == "__main__":
    main()
