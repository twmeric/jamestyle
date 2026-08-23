# 🎨 卡片生成器模塊 — 智能體部署指南

> 來源：JameStyle 項目（1080×1080 語錄卡片，Canvas + Python 雙軌生成）
> 用途：任何需要「圖片 + 金句 + 郵戳 + 品牌 footer」的方形卡片場景

---

## 1. 架構概覽

本模塊採用 **雙軌並行** 設計：

```
┌─────────────────────────────────────────────────────────┐
│                    卡片生成器模塊                          │
├─────────────────────┬───────────────────────────────────┤
│   Canvas (瀏覽器)    │      Python PIL (伺服器/腳本)       │
│   CollageGenerator   │      generate_cards.py             │
├─────────────────────┼───────────────────────────────────┤
│ • 用戶實時預覽       │ • 批量預生成高品質 PNG              │
│ • 動態選擇圖片/文字   │ • 上傳 CDN / R2 / WhatsApp         │
│ • 可下載/分享        │ • 字體渲染更精確                   │
└─────────────────────┴───────────────────────────────────┘
         ↑                              ↑
         └────── 共用同一套 Stamp 算法 ──┘
```

### 核心繪製流程（6 步驟）

```
Step 1: 背景填充 (#FAF8F3 米白)
   ↓
Step 2: 圖片 + 白色 Frame + 金色內線 + 陰影
   ↓
Step 3: 郵戳 Stamp（旋轉 40°，壓在 frame 右下角）
   ↓
Step 4: 金句文字（自動換行 + 自適應字號）
   ↓
Step 5: Footer 品牌文字
   ↓
Step 6: 輸出 PNG
```

---

## 2. 畫布佈局參數（1080×1080）

| 元素 | 參數 | 說明 |
|------|------|------|
| 畫布 | `1080 × 1080` | 正方形，適合 Instagram / WhatsApp |
| 背景色 | `#FAF8F3` `(250, 248, 243)` | 溫暖米白，不要純白 |
| Frame 白邊 | `12px` | 圖片四周留白 |
| Frame 陰影 | `blur=24, offset=(4,8), α=0.1` | 柔和長陰影 |
| Frame 金線 | `#C4956A`, `1px` | 內框裝飾線 |
| 圖片區域 | `maxW=1050, maxH=780` | 預留下方文字空間 |
| 文字顏色 | `#5A5248` `(90,82,72)` | 深褐灰，柔和不刺眼 |
| Footer | 畫布底部 `50px` | 品牌網址 |

### 佈局示意圖

```
┌─────────────────────────────┐  ← y=0
│      背景 #FAF8F3            │
│  ┌─────────────────────┐    │  ← y=60 (圖片頂部)
│  │                     │    │
│  │      [圖片]          │    │  ← Frame 白邊 + 陰影
│  │                     │    │
│  │            ╭───╮    │    │  ← Stamp 壓在右下角
│  │            │郵戳│    │    │     約 2/3 在 frame 內
│  └────────────┴───┘────┘    │     約 1/3 伸出 frame 外
│                             │
│     「金句文字第一行」        │  ← quote_y = frame底 + 35
│     「金句文字第二行」        │
│                             │
│      JameStyle.com          │  ← y=1030 (底部 50px)
└─────────────────────────────┘  ← y=1080
```

---

## 3. 🎯 Stamp（郵戳）核心算法

這是整個模塊**最複雜也最關鍵**的部分。Stamp 必須看起來像真實的郵戳，同時文字保持水平可讀。

### 設計規範

```
┌────────────────────┐
│   26/4/2026        │  ← 頂部：日期，水平
│  ═══════════════   │  ← 緞帶上線
│   JAMESTYLE        │  ← 中央：品牌名，最粗最大
│  ═══════════════   │  ← 緞帶下線
│   阿占隨意          │  ← 底部：作者名，水平
└────────────────────┘
      ↓ 整個圓形旋轉 40°
```

| 屬性 | Canvas 值 | Python PIL 值 | 說明 |
|------|-----------|---------------|------|
| 半徑 | `r = 75` | `r = 80` | Python 用稍大一點 |
| 外圈線寬 | `3px` | `5px` | PIL 需要更粗才明顯 |
| 外圈顏色 | `rgba(74,74,74,0.85)` | `(74,74,74,220)` | 深灰墨水色 |
| 內圈線寬 | `1px` | `1px` | 細線裝飾 |
| 內圈顏色 | `rgba(74,74,74,0.4)` | `(74,74,74,120)` | 較淡 |
| 旋轉角度 | `40°` | `40°` | 兩者一致 |
| 緞帶高度 | `24px` | `r//3 ≈ 26px` | 兩條橫線間距 |
| 品牌字 | `bold 16px Arial` | `24px Arial Bold` | 中央最大字 |
| 日期字 | `18px` | `r//4 ≈ 20px` | 頂部 |
| 作者字 | `18px` | `r//4 ≈ 20px` | 底部 |

### 🌟 核心技巧：先繪製 → 後旋轉

**絕對不能逐字旋轉！** 正確做法是：
1. 在一個獨立的透明畫布上，**水平繪製**所有元素
2. 將整個畫布 **旋轉 40°**
3. 貼到主畫布上

#### Canvas 實現

```typescript
function drawStamp(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const R = 75;                    // 郵戳半徑
  const ANGLE = (40 * Math.PI) / 180;  // 旋轉 40°

  ctx.save();
  ctx.translate(cx, cy);           // 移動到 stamp 中心
  ctx.rotate(ANGLE);               // ← 整體旋轉！

  // === 1. 外圈 ===
  ctx.strokeStyle = 'rgba(74, 74, 74, 0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.stroke();

  // === 2. 內圈（細） ===
  ctx.strokeStyle = 'rgba(74, 74, 74, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, R - 6, 0, Math.PI * 2);
  ctx.stroke();

  // === 3. 緞帶（兩條橫線） ===
  const bandY = -12;               // 緞帶中心偏上
  const bandH = 24;                // 緞帶高度
  const lineLen = Math.floor(R * 1.3);  // 線長超出圓形

  ctx.strokeStyle = 'rgba(74, 74, 74, 0.85)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-lineLen / 2, bandY);
  ctx.lineTo(lineLen / 2, bandY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-lineLen / 2, bandY + bandH);
  ctx.lineTo(lineLen / 2, bandY + bandH);
  ctx.stroke();

  // === 4. 中央文字（水平！） ===
  ctx.fillStyle = 'rgba(74, 74, 74, 0.9)';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('JAMESTYLE', 0, 5);    // y=5 微調視覺居中

  // === 5. 頂部日期 ===
  ctx.font = '18px Arial, sans-serif';
  ctx.fillText('26/4/2026', 0, bandY - 14);

  // === 6. 底部作者 ===
  ctx.font = '18px "LXGW WenKai", "PingFang TC", sans-serif';
  ctx.fillText('阿占隨意', 0, bandY + bandH + 26);

  ctx.restore();  // ← 恢復坐標系
}
```

#### Python PIL 實現

```python
from PIL import Image, ImageDraw, ImageFont

INK_COLOR = (74, 74, 74)

def draw_postmark_stamp(radius: int, rotate: int = 40):
    """
    創建透明背景的郵戳，然後整體旋轉。
    返回帶 Alpha 的 PIL Image。
    """
    pad = 30
    size = radius * 2 + pad * 2
    stamp = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(stamp)
    cx = cy = size // 2
    ink = (*INK_COLOR, 220)  # 帶透明度

    # 1. 外圈粗線
    draw.ellipse(
        [cx - radius, cy - radius, cx + radius, cy + radius],
        outline=ink, width=5
    )

    # 2. 內圈細線
    draw.ellipse(
        [cx - radius + 6, cy - radius + 6, cx + radius - 6, cy + radius - 6],
        outline=(*INK_COLOR, 120), width=1
    )

    # 3. 緞帶兩條橫線（超出圓形邊界）
    band_half_h = max(20, radius // 3)
    line_len = int(radius * 1.5)
    band_y1 = cy - band_half_h
    band_y2 = cy + band_half_h
    draw.line([(cx - line_len//2, band_y1), (cx + line_len//2, band_y1)], fill=ink, width=4)
    draw.line([(cx - line_len//2, band_y2), (cx + line_len//2, band_y2)], fill=ink, width=4)

    # 4. 中央品牌名（最大）
    font_main = ImageFont.truetype("arialbd.ttf", 24)
    bbox = draw.textbbox((0, 0), "JAMESTYLE", font=font_main)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((cx - tw//2, cy - th//2), "JAMESTYLE", font=font_main, fill=ink)

    # 5. 頂部日期
    font_date = ImageFont.truetype("arial.ttf", 20)
    bbox = draw.textbbox((0, 0), "26/4/2026", font=font_date)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((cx - tw//2, band_y1 - th - 6), "26/4/2026", font=font_date, fill=ink)

    # 6. 底部作者
    font_author = ImageFont.truetype("chinese_font.ttf", 20)
    bbox = draw.textbbox((0, 0), "阿占隨意", font=font_author)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((cx - tw//2, band_y2 + 10), "阿占隨意", font=font_author, fill=ink)

    # ← 關鍵：整個 stamp 一起旋轉
    return stamp.rotate(rotate, expand=True, resample=Image.BICUBIC)
```

### Stamp 定位公式

Stamp 壓在 **frame 右下角**，約 2/3 在 frame 內，1/3 伸出 frame 外：

```
// Canvas
stampCx = frameX + frameW - (stampR * 2) / 3;  // ← 約 2/3 半徑處
stampCy = frameY + frameH - (stampR * 2) / 3;

// Python PIL
stamp_cx = frame_x + frame_w - stamp_r * 2 // 3;
stamp_cy = frame_y + frame_h - stamp_r * 2 // 3;
sx = stamp_cx - stamp.width // 2;   // 貼上時需減去自身半寬
sy = stamp_cy - stamp.height // 2;
```

---

## 4. 圖形拼合完整流程

### 4.1 圖片縮放與 Frame

```
輸入: 原始圖片 (任意尺寸)
輸出: 居中 + 等比例縮放 + 白色 frame + 金色內線 + 陰影
```

```typescript
// Canvas 實現
const maxW = 1050;
const maxH = 780;
const aspect = img.naturalWidth / img.naturalHeight;
let dw = maxW, dh = maxW / aspect;
if (dh > maxH) { dh = maxH; dw = maxH * aspect; }

// 居中位置
const imgX = Math.round((CANVAS_W - dw) / 2);
const imgY = 80;

// Frame（比圖片大 24px，即四周各 12px）
const frameX = imgX - 12;
const frameY = imgY - 12;
const frameW = dw + 24;
const frameH = dh + 24;

// 陰影
ctx.save();
ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
ctx.shadowBlur = 24;
ctx.shadowOffsetX = 4;
ctx.shadowOffsetY = 8;
ctx.fillStyle = '#FFFFFF';
ctx.fillRect(frameX, frameY, frameW, frameH);
ctx.restore();

// 金色內線
ctx.strokeStyle = '#C4956A';
ctx.lineWidth = 1;
ctx.strokeRect(imgX - 1, imgY - 1, dw + 2, dh + 2);

// 圖片
ctx.drawImage(img, imgX, imgY, dw, dh);
```

```python
# Python PIL 實現
from PIL import Image, ImageDraw, ImageFilter

# 陰影（先畫在獨立圖層，再加模糊）
shadow = Image.new("RGBA", (frame_w + 8, frame_h + 8), (0, 0, 0, 0))
shadow_draw = ImageDraw.Draw(shadow)
shadow_draw.rectangle([4, 4, frame_w + 4, frame_h + 4], fill=(0, 0, 0, 25))
canvas.paste(
    shadow.filter(ImageFilter.GaussianBlur(8)),
    (frame_x - 4, frame_y - 4),
    shadow
)

# 白色 Frame
draw.rectangle([frame_x, frame_y, frame_x + frame_w, frame_y + frame_h], fill=(255,255,255))

# 金色內線
draw.rectangle(
    [frame_x + 11, frame_y + 11, frame_x + frame_w - 11, frame_y + frame_h - 11],
    outline=(196, 149, 106), width=1
)

# 圖片（LANCZOS 高品質縮放）
resized = src_img.resize((img_w, img_h), Image.LANCZOS)
canvas.paste(resized, (img_x, img_y))
```

### 4.2 文字自動換行與自適應字號

中文排版關鍵：**優先在標點處斷行**，而非逐字截斷。

```typescript
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  // 按標點分割成自然語段
  const segments = text.split(/([，。！？；：、])/);
  const parts: string[] = [];
  for (let i = 0; i < segments.length; i += 2) {
    parts.push(segments[i] + (segments[i + 1] || ''));
  }

  const lines: string[] = [];
  let line = '';
  for (const part of parts) {
    const test = line + part;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = part;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  // Fallback：逐字截斷（極長詞語時備用）
  const result: string[] = [];
  for (const line of lines) {
    if (ctx.measureText(line).width > maxWidth) {
      const chars = line.split('');
      let subLine = '';
      for (const char of chars) {
        const test = subLine + char;
        if (ctx.measureText(test).width > maxWidth && subLine.length > 0) {
          result.push(subLine);
          subLine = char;
        } else {
          subLine = test;
        }
      }
      if (subLine) result.push(subLine);
    } else {
      result.push(line);
    }
  }
  return result;
}
```

### 4.3 字號自適應策略

```
嘗試字號: 60px → 52px → 46px → 40px → 34px
條件: 計算換行後的總高度 <= 可用空間
可用空間 = CANVAS_H - quote_y - 80 (footer 預留)
```

```python
# Python 實現
font_sizes = [60, 52, 46, 40, 34]
for size in font_sizes:
    font = get_font(size=size)
    lines = wrap_text(draw, caption, font, max_text_w)
    line_h = size + 12
    total_h = len(lines) * line_h
    available_quote_h = CANVAS_H - quote_y - 80
    if total_h <= available_quote_h or size == 34:  # 34 是最小保底
        chosen_font, chosen_lines, chosen_size = font, lines, size
        if total_h <= available_quote_h:
            break
```

---

## 5. 快速部署清單

### 5.1 新項目需要的文件

```
新項目/
├── src/
│   ├── components/
│   │   └── CardGenerator.tsx      ← Canvas 實時生成組件
│   ├── utils/
│   │   └── cardRenderer.ts        ← 純繪製邏輯（可脫離 React）
│   └── data/
│       └── quotes.ts              ← 金句數據
├── scripts/
│   └── generate_cards.py          ← Python 批量預生成
├── public/
│   ├── images/                    ← 原始圖片
│   └── fonts/                     ← 中文字體（可選）
└── card-config.ts                 ← 所有可配置參數
```

### 5.2 可配置參數文件（card-config.ts）

```typescript
export const CARD_CONFIG = {
  // 畫布
  CANVAS_W: 1080,
  CANVAS_H: 1080,
  BG_COLOR: '#FAF8F3',

  // Frame
  FRAME_PAD: 12,
  FRAME_COLOR: '#FFFFFF',
  FRAME_SHADOW: { blur: 24, offsetX: 4, offsetY: 8, color: 'rgba(0,0,0,0.1)' },
  GOLD_LINE_COLOR: '#C4956A',

  // 圖片
  MAX_IMG_W: 1050,
  MAX_IMG_H: 780,
  IMG_TOP_MARGIN: 80,

  // Stamp
  STAMP_RADIUS: 75,           // Canvas
  STAMP_RADIUS_PY: 80,        // Python
  STAMP_ROTATION: 40,
  STAMP_COLOR: 'rgba(74,74,74,0.85)',
  STAMP_OVERLAP_RATIO: 2/3,   // 2/3 在 frame 內
  STAMP_BRAND_TEXT: 'JAMESTYLE',
  STAMP_DATE_TEXT: '26/4/2026',
  STAMP_AUTHOR_TEXT: '阿占隨意',

  // 文字
  TEXT_COLOR: '#5A5248',
  FONT_FAMILY: '"LXGW WenKai", "PingFang TC", sans-serif',
  MAX_TEXT_WIDTH: 860,
  QUOTE_TOP_MARGIN: 60,       // frame 底部到文字的距離
  FONT_SIZES: [50, 44, 38, 34],  // 嘗試順序

  // Footer
  FOOTER_TEXT: 'JameStyle.com',
  FOOTER_FONT_SIZE: 26,
  FOOTER_BOTTOM_MARGIN: 50,
};
```

### 5.3 一鍵部署腳本

```bash
# 1. 複製核心文件到新項目
cp card-config.ts new-project/src/
cp cardRenderer.ts new-project/src/utils/
cp generate_cards.py new-project/scripts/

# 2. 修改配置（品牌名、日期、顏色等）
# 編輯 card-config.ts

# 3. 準備圖片
# 將原始圖片放入 new-project/public/images/

# 4. 預生成卡片
python new-project/scripts/generate_cards.py

# 5. 構建前端（自動包含 Canvas 組件）
cd new-project && pnpm run build
```

---

## 6. 常見問題

### Q1: Stamp 文字模糊怎麼辦？
- Canvas：確保在 `translate()` 之後繪製，不要直接用小數坐標
- PIL：使用 `Image.LANCZOS` 縮放，字體大小不要低於 16px

### Q2: 中文字體顯示為方框？
- Canvas：確保 CSS 中已加載中文字體，且 `document.fonts.ready` 後再繪製
- PIL：安裝中文字體（如 `LXGW WenKai`）並正確指定路徑

### Q3: 圖片跨域報錯？
- 設置 `img.crossOrigin = 'anonymous'`
- 伺服器響應頭需包含 `Access-Control-Allow-Origin: *`

### Q4: 字號自適應後還是溢出？
- 增加 `FONT_SIZES` 的最小值（如加入 `28px`）
- 或縮小 `MAX_IMG_H` 給文字更多空間

---

## 7. 完整可運行最小示例

### Canvas 最小示例（獨立 HTML）

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>body { margin: 0; background: #222; display: flex; justify-content: center; align-items: center; min-height: 100vh; }</style>
</head>
<body>
  <canvas id="c"></canvas>
  <script>
    const W = 1080, H = 1080;
    const canvas = document.getElementById('c');
    canvas.width = W; canvas.height = H;
    canvas.style.width = '540px'; canvas.style.height = '540px';
    const ctx = canvas.getContext('2d');

    // 背景
    ctx.fillStyle = '#FAF8F3';
    ctx.fillRect(0, 0, W, H);

    // Frame + 陰影
    const fx = 100, fy = 80, fw = 880, fh = 700;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 24; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(fx, fy, fw, fh);
    ctx.restore();

    // 圖片區（此處用灰色代替）
    ctx.fillStyle = '#E8E4DC';
    ctx.fillRect(fx + 12, fy + 12, fw - 24, fh - 24);

    // === STAMP ===
    const R = 75;
    const cx = fx + fw - R * 2 / 3;
    const cy = fy + fh - R * 2 / 3;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(40 * Math.PI / 180);

    ctx.strokeStyle = 'rgba(74,74,74,0.85)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();

    ctx.strokeStyle = 'rgba(74,74,74,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, R - 6, 0, Math.PI * 2); ctx.stroke();

    const bandY = -12, bandH = 24, lineLen = Math.floor(R * 1.3);
    ctx.strokeStyle = 'rgba(74,74,74,0.85)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-lineLen/2, bandY); ctx.lineTo(lineLen/2, bandY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-lineLen/2, bandY+bandH); ctx.lineTo(lineLen/2, bandY+bandH); ctx.stroke();

    ctx.fillStyle = 'rgba(74,74,74,0.9)'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
    ctx.fillText('JAMESTYLE', 0, 5);
    ctx.font = '18px Arial';
    ctx.fillText('26/4/2026', 0, bandY - 14);
    ctx.fillText('Brand', 0, bandY + bandH + 26);
    ctx.restore();

    // 文字
    ctx.fillStyle = '#5A5248'; ctx.font = 'bold 44px Arial'; ctx.textAlign = 'center';
    ctx.fillText('這是你的金句', W/2, fy + fh + 80);

    // Footer
    ctx.font = 'bold 26px Arial';
    ctx.fillText('YourBrand.com', W/2, H - 50);
  </script>
</body>
</html>
```

---

*本模塊由 JameStyle 項目提煉，核心為「先水平繪製 → 後整體旋轉」的 Stamp 算法，以及雙軌（Canvas + Python）圖形拼合流程。*
