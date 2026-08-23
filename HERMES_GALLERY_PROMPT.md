# Hermes Agent — JameStyle Gallery 數據庫知識注入

## 1. 基礎設施

| 項目 | 值 |
|------|-----|
| R2 Bucket | `jamestyle-cards` |
| 自訂域名 | `https://file.jamestyle.com`（**已取代** `pub-*.r2.dev` 開發用網址） |
| 用途 | 靜態檔案託管（圖片、JSON 數據庫） |
| 畫廊頁面 | `https://jamestyle.com/gallery/` |
| 單張直連 | `https://jamestyle.com/gallery/?code={code}` |

## 2. 數據庫結構

### 2.1 主數據庫文件
- **URL**: `https://jamestyle.com/gallery-data.json`
- **格式**: JSON
- **總筆數**: 134 則語錄（持續擴充中）

### 2.2 單條記錄 Schema
```json
{
  "code": "9fz0",
  "id": 1,
  "title": "直播人生",
  "caption": "人生沒有綵排，每天都是直播！",
  "insight": "沒有劇本，沒有重來。每一秒都是首演，觀眾多少不重要，演好自己才是正事。",
  "image": "gallery-images/9fz0.jpeg"
}
```

| 欄位 | 說明 | 示例 |
|------|------|------|
| `code` | 4 位隨機代碼（a-z0-9），唯一識別碼 | `9fz0`, `7xc7` |
| `id` | 流水序號（1~N） | `1`, `2` |
| `title` | 語錄標題（2~6 字） | `直播人生` |
| `caption` | 語錄原文（阿占隨意金句） | `人生沒有綵排，每天都是直播！` |
| `insight` | 解畫文字（走心、 timeless、30~50 字） | `沒有劇本，沒有重來...` |
| `image` | 圖片相對路徑 | `gallery-images/9fz0.jpeg` |

### 2.3 圖片直連 URL 規則
```
https://jamestyle.com/gallery-images/{code}.jpeg
```
**舊 R2 路徑已棄用**：~~`https://r2.jamestyle.com/...`~~ → 統一使用 Pages CDN

## 3. 畫廊頁面功能

- **牆紙背景**: `/images/gallery-wall.png`（米白射燈畫廊牆）
- **背景音樂**: `/music/gallery.mp3`（Canon，playbackRate 0.85x）
- **互動設計**:
  - 網格瀏覽（響應式 2~5 列）
  - 點擊卡片彈出模態框
  - **語錄預設顯示，解畫需點擊「✨ 解畫」按鈕展開**
  - 左右箭頭 / 鍵盤切換
  - 搜尋（標題、語錄、解畫）
  - `?code=xxxx` 直連分享
  - ❤️ / 👍 反應（localStorage）
  - WhatsApp 分享

## 4. 與其他訊息混合使用的方法

當你需要引用畫廊內容時，請遵循以下格式：

### 4.1 引用單則語錄
```
阿占隨意《{title}》：「{caption}」
解畫：{insight}
連結：https://jamestyle.com/gallery/?code={code}
```

### 4.2 批量引用（主題分類）
根據 `caption` 和 `insight` 的關鍵詞，可將語錄分類為：
- **人生態度**: 直播人生、乘風破浪、夾硬嚟、無所謂...
- **情感關係**: 真朋友、四季有空、夠飽、前度活該...
- **自我成長**: 夢與行動、天才真相、一萬次、放下...
- **生活哲學**: 接受大便、今朝醉、酒難飲、燒味飯...

### 4.3 與檔案分享混合
當用戶要求「分享某張卡片」或「發送語錄圖片」時：
1. 從 `gallery-data.json` 查找對應 `code`
2. 圖片 URL = `https://jamestyle.com/gallery-images/{code}.jpeg`
3. 分享連結 = `https://jamestyle.com/gallery/?code={code}`
4. **使用 `file.jamestyle.com` 作為 R2 檔案分享的域名**（非 pub-*.r2.dev）

## 5. 操作示例

### 示例 1：回覆用戶「我想看關於勇氣的語錄」
```
阿占隨意有幾則關於勇氣的語錄：

1. 《夾硬嚟》：「世上無難事，只要夾硬嚟！」
   解畫：膽子比能力更重要。很多奇蹟，不過是普通人硬著頭皮走出第一步。
   👉 https://jamestyle.com/gallery/?code=zylg

2. 《勇敢前行》：「勇敢是明知難，仍然力前行！」
   ...
```

### 示例 2：生成 WhatsApp 分享訊息
```
{caption}

— 阿占隨意《{title}》
https://jamestyle.com/gallery/?code={code}
```

### 示例 3：與 R2 檔案分享混合
```
用戶：我想分享這張圖片到 WhatsApp
→ 從 gallery-data.json 取得 code
→ 圖片直連：https://jamestyle.com/gallery-images/{code}.jpeg
→ 或使用 R2 域名：https://file.jamestyle.com/gallery-images/{code}.jpeg
```

## 6. 注意事項

- **code 是唯一識別碼**，不可重複，不可預測（隨機 4 位）
- **所有圖片已部署到 Pages CDN**，無需再經過 R2 代理
- **gallery-data.json 為單一數據源**，新增/修改語錄時只需更新此文件
- **解畫風格**: 走心、 timeless、撇除 Z 世代用語、30~50 字
- **語錄語言**: 繁體中文為主，混合粵語口語
