# JameStyle — Agent 維護指南

## 項目概覽

這是一個**沉浸式互動畫廊網站**，核心流程：

1. **Healing Intro** (~35s) — 呼吸動畫 → 煩惱氣泡（可戳破）→ 消化金句 → 輪播預告 → 「我哋出發」
2. **Card Gallery** — 15 張作品卡片，支持滑動/點擊瀏覽，四種情緒反應 + 👍 反應（淺色畫展風格，四類畫框）
3. **Quote Gallery** — 134 條阿占隨意語錄，3D 翻轉卡片，10 種畫框風格，密碼保護（4453），單條分享模式（`?code=xxx`）
4. **Ending Screen** — 結尾感謝頁 + WhatsApp 索取卡片（CollageGenerator）
5. **Analytics Dashboard** — 隱藏數據後台（快速連按 `a` 鍵 3 次觸發）

## 架構

```
┌─────────────────┐     CORS + credentials     ┌─────────────────────────────┐
│  Cloudflare     │  ───────────────────────►  │  Cloudflare Worker          │
│  Pages (靜態)   │                            │  jamestyle-analytics        │
│  jamestyle.com  │  ◄──────────────────────── │  D1 SQLite 數據庫 + R2      │
└─────────────────┘     JSON { data: ... }     └─────────────────────────────┘
                              │                           ▲
                              │  WhatsApp deeplink        │  proactive send
                              ▼                           │
                        ┌─────────────┐          ┌────────┴────────┐
                        │  Salesmartly │ ───────► │  CloudWapi      │
                        │  (客服系統)  │  webhook │  (WhatsApp API) │
                        └─────────────┘          └─────────────────┘
```

- **前端** 使用 EdgeSpark (`@edgespark/client`) 的 `client.api.fetch()` 發送請求
- `client.api.fetch` **自動攜帶 `Authorization` header 和 `credentials: 'include'`**
- 因此 Worker CORS **必須**設置 `credentials: true` 且 `origin` **不能是 `*`**

## 關鍵文件

| 文件 | 職責 |
|------|------|
| `.build_src/src/App.tsx` | 主應用流程控制（phase: healing → opening → gallery → ending） |
| `.build_src/src/components/HealingIntro.tsx` | 開場動畫（6 階段：breathing → bubbles → digest → slideshow → complete → exiting） |
| `.build_src/src/components/CardGallery.tsx` | 畫廊瀏覽（滑動/點擊、四種情緒反應、進度條、作品名稱 plaque） |
| `.build_src/src/components/LangToggle.tsx` | 右上角工具列（☰ Menu、🔊/🎵/語言切換） |
| `.build_src/src/components/EndingScreen.tsx` | 結尾頁（WhatsApp CTA、CollageGenerator 入口） |
| `.build_src/src/components/CollageGenerator.tsx` | 卡片生成器（Canvas 繪製 1080×1080 PNG，result step 只顯示語錄+作品名，不顯示 PNG 預覽） |
| `.build_src/src/components/AchievementToast.tsx` | 成就解鎖通知（左上角，complete 階段自動隱藏） |
| `.build_src/src/components/AnalyticsDashboard.tsx` | 數據後台（9 個 Tab + ⚙️ 設置 Modal） |
| `.build_src/src/api/reactionsApi.ts` | 所有 API 調用 + session 管理 + 事件批處理 |
| `.build_src/src/store/appStore.ts` | Zustand 狀態（phase, lang, slide, tracking, favorites） |
| `.build_src/src/data/slides.ts` | 15 張作品的數據（caption, title, emoji, image, act） |
| `.build_src/public/gallery/index.html` | 134 條語錄畫廊（靜態 HTML/JS，獨立於 React 主應用） |
| `.build_src/public/gallery-data.json` | 134 條語錄數據（caption, title, insight, image, code） |
| `.build_src/public/_worker.js` | Pages Functions SSR（`?code=` 動態 OG 標籤） |
| `backend/migrations/002_quotes.sql` | D1 quotes + quote_reactions 表創建 + 134 條種子數據 |
| `scripts/convert_webp.py` | JPEG → WebP 批量轉換腳本 |
| `.build_src/src/utils/achievements.ts` | 成就系統定義與解鎖邏輯 |
| `backend/src/index.ts` | Worker API 路由（20+ 端點） |
| `backend/src/schema.ts` | D1 數據庫 Schema（Drizzle） |
| `scripts/generate_cards.py` | 預生成 15 張卡片 PNG（PIL） |

## 構建與部署

```powershell
# 1. 前端構建
cd .build_src && pnpm run build

# 2. 複製到部署目錄（/MIR 鏡像同步，確保刪除舊文件）
robocopy .build_src\dist .deploy_tmp /MIR

# 3. 部署前端 (Cloudflare Pages)
cd backend
$env:CLOUDFLARE_API_TOKEN = (Get-Content C:\Users\Owner\.wrangler\config.json | ConvertFrom-Json).api_token
pnpm exec wrangler pages deploy ..\.deploy_tmp --project-name=jamestyle --branch=main

# 4. 部署後端 (Cloudflare Worker)
pnpm exec wrangler deploy --config=wrangler.toml
```

### 預生成卡片更新流程

當修改 `scripts/generate_cards.py` 後：

```powershell
# 1. 生成卡片
cd scripts && python generate_cards.py

# 2. 複製到 static hosting
robocopy scripts\output_cards .build_src\public\cards /MIR

# 3. 上傳到 R2（WhatsApp 下載來源）
cd backend
foreach ($f in (Get-ChildItem ..\scripts\output_cards\*.png)) {
  $r2Key = $f.Name -replace "slide_(\d{2})\.png", (Get-Random -Count 8 -InputObject @('a'..'z') | Join-String)
  # 實際使用固定映射：slide_01.png → x7k9m2p4.png，見 generate_cards.py 中 R2_NAMES
  pnpm exec wrangler r2 object put "jamestyle-cards/$r2Key" --file="$($f.FullName)" --content-type="image/png"
}

# 4. 重新構建並部署前端（讓 dist 包含最新 cards）
```

## 數據庫 Schema

```
reactions          (id, slide_id, reaction_type, session_id, created_at)
visitor_sessions   (id, fingerprint, user_agent, referrer, device_type,
                    screen_width, screen_height, language,
                    session_start, last_active,
                    total_slides_viewed, max_slide_reached,
                    completed_gallery, took_quiz, quiz_result)
visitor_events     (id, session_id, event_type, slide_id, event_data, duration_ms, created_at)
device_metrics     (id, session_id, device_type, screen_width, screen_height,
                    device_pixel_ratio, orientation, os, browser, fcp_ms,
                    connection_type, language, timezone, memory_gb,
                    touch_latency_ms, max_touch_points, created_at)
card_shares        (id, share_token, slide_id, session_id, created_at)
whatsapp_leads     (id, phone, name, slide_id, card_url, source, status, created_at)
quotes             (id, code, title, caption, insight, image, today_insight, updated_at, order_id)
quote_reactions    (id, quote_code, reaction_type, session_id, created_at)
subscribers        (id, phone, name, source_code, status, created_at)
```

## ⚠️ 重要注意事項

### 1. CORS 配置
Worker CORS **絕對不能用 `origin: "*"`**，因為 EdgeSpark client 使用 `credentials: 'include'`。必須顯式指定域名：

```typescript
app.use("*", cors({
  origin: ["https://jamestyle.com", "https://www.jamestyle.com", "http://localhost:5173"],
  allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Reset-Token"],
  credentials: true,
}));
```

### 2. Worker 中文編碼問題
Cloudflare Worker 運行時對 TypeScript 源文件中的**中文硬編碼字符串**處理不穩定，可能出現亂碼。

**解決方案**：後端 API 返回的枚舉值統一使用**英文 key**，前端負責映射到中文標籤。

### 3. WhatsApp 卡片分享流程（重塑後）

```
用戶點擊「索取卡片」
  → POST /api/public/card-share/request (slideId)
  → Worker 創建 share token，返回 WhatsApp deeplink
  → 用戶發送預設訊息到 Salesmartly (85262322466)
  → Salesmartly webhook → Worker 回覆語錄典藏頁連結 (/dl/:token)
  → 用戶進入語錄典藏頁（只顯示語錄文字 + 作品名，無圖片）
  → 點擊「解鎖高清卡片」→ GET /api/public/card-share/unlock/:token
  → 返回 PNG 下載 URL → 自動下載
```

**核心原則**：語錄典藏頁和 CollageGenerator result step **絕對不能顯示任何卡片圖片預覽**，確保客人必須通過 WhatsApp 互動才能拿到 PNG，創造二次接觸機會。

**預填充訊息格式**：
```
我想下載阿占語錄卡片 [圖片]
第5號作品《唔好太用力》
來自 JameStyle.com
```

### 4. 成就系統
- 成就定義在 `achievements.ts`，解鎖後 dispatch `achievement-unlocked` 事件
- `AchievementToast` 顯示於左上角 (`top-4 left-4`)
- HealingIntro 進入 `complete` 階段（顯示「我哋出發」）時自動 dispatch `hide-achievement-toast` 隱藏通知

### 5. 畫廊風格規範（白色畫展主題）
- **背景色**：`#F5F2ED`（米白畫廊牆）
- **四種畫框風格**（按 Act 類別）：
  - 扎心共鳴：粗黑現代框 `border-[5px] border-[#1a1a1a]` + offset 陰影
  - 溫柔療癒：圓潤木紋框 `border-[6px] border-[#A67C52]` + inset 高光
  - 人生態度：細金屬框 `border-[1.5px] border-[#C4956A]` + 雙層線效果
  - 品牌個性：雙層立體框 `border-[3px] border-[#2a2a2a]` + 多重 shadow
- **內襯色**：每類別對應不同 matte 底色（白/暖白/灰白）
- **右上角工具列**（LangToggle）：gallery 階段全透明 `bg-transparent`，無底色無邊框
- **Footer**：normal flow block，非 fixed，拉到底才見到

### 6. 作品數據結構（15 張主畫廊）
每張作品包含：
- `id`：編號 1-15
- `title`：作品名稱（繁簡各 15 個，如「人生大便」「包與剪」「鬥快拔機」等）
- `caption`：語錄全文
- `insight`：解畫文字
- `act`：類別 0-3
- `emoji`：代表表情
- `img`：圖片路徑

畫廊底部 plaque 顯示：`№ 01 · 人生大便 · 2026`（使用 `title[lang]`）

### 6b. 語錄畫廊（134 條擴展）
- **入口**：`https://jamestyle.com/gallery/`（密碼 4453）或 `https://jamestyle.com/?code={code}`（公開分享）
- **數據源**：D1 `quotes` 表（134 條），靜態備份 `public/gallery-data.json`
- **圖片**：`public/gallery-images/{code}.jpeg` + `public/gallery-images-webp/{code}.webp`（Picture 標籤自動適配）
- **today_insight**：每日更新的「今日解畫」，由外部 Agent 通過 Admin API 批量更新
- **反應**：5 種（like/love/laugh/wow/sad），同步到 D1 `quote_reactions`
- **訂閱**：WhatsApp 訂閱流程，通過 `POST /api/public/subscribe/request` + Salesmartly Webhook

### 6c. today_insight 每日解畫
- **來源**：外部 Agent 每日 5:00 AM 自動運行
- **流程**：抓取香港新聞 → 分析情緒 → 為 134 條語錄各寫 ≤40 字 today_insight → POST `/api/admin/today-insights`
- **存儲**：D1 `quotes.today_insight` + `updated_at`
- **顯示**：畫廊 Modal 和單條視圖優先顯示 today_insight，無則回退到固定 insight
- **原則**：完全取代固定 insight，無 toggle，無歷史記錄，只顯示今日

### 7. 預生成卡片 vs 實時生成
- **預生成卡片**：`scripts/generate_cards.py` → R2 + static hosting，用於 WhatsApp 分享
- **實時生成**：`CollageGenerator.tsx` Canvas 繪製（背景生成，UI 不顯示預覽）
- **兩者必須保持一致**：字體、佈局、stamp 位置等修改需同步更新
- **Stamp 日期**：動態生成當天日期（Canvas: `new Date()` / Python: `datetime.now()`）

### 8. Stamp 設計規範
- 半徑：80px（Python）/ 75px（Canvas）
- 位置：frame 右下角內約 2/3 半徑處（約 53px），約 1/3 在 frame 外
- 字體：JAMESTYLE 34px bold，日期/阿占隨意 18px，旋轉 40°
- 顏色：深灰墨水 `#4A4A4A`（RGB 74,74,74），透明度 0.85

### 9. 裝置數據收集
`appStore.ts` 的 `initTracking()` 在每次頁面加載時向 `POST /api/public/device-metrics` 發送裝置信息，**不區分裝置類型**。

### 10. 緩存策略
Cloudflare Pages 有 CDN 緩存。部署後如果用戶看到舊版本，需要**硬刷新** (`Ctrl+Shift+R`)。

### 11. 新增 D1 表
D1 不會自動根據 Drizzle schema 創建表。新增表後需要手動執行 SQL：

```bash
cd backend
pnpm exec wrangler d1 execute jamestyle-db --remote --file=migrations/xxxx.sql
```

### 11b. WebP 圖片更新流程
當新增或更新語錄圖片時：

```powershell
# 1. 將 JPEG 放入 .build_src/public/gallery-images/
# 2. 執行批量轉換
cd scripts && python convert_webp.py
# 3. 重新構建並部署前端（dist 自動包含 WebP）
cd ..\.build_src && pnpm run build
robocopy .build_src\dist .deploy_tmp /MIR
cd backend
$env:CLOUDFLARE_API_TOKEN = (Get-Content C:\Users\Owner\.wrangler\config.json | ConvertFrom-Json).api_token
pnpm exec wrangler pages deploy ..\.deploy_tmp --project-name=jamestyle --branch=main
```

### 12. 數據重置
後台提供一鍵重置端點（清空所有分析數據）：

```bash
Invoke-RestMethod -Uri 'https://jamestyle-analytics.jimsbond007.workers.dev/api/admin/reset' `
  -Method POST -Headers @{ "X-Reset-Token" = "jamesstyle-reset-2025" }
```

## 環境變量

| 變量 | 位置 | 說明 |
|------|------|------|
| `CLOUDFLARE_API_TOKEN` | 本地環境 | Wrangler 部署所需 |
| `RESET_TOKEN` | Worker secret | 後台重置接口驗證 |
| `ADMIN_WHATSAPP` | Worker secret | WhatsApp 客服號碼（85262322466） |
| `CLOUDWAPI_KEY` | Worker secret | CloudWapi WhatsApp API Key |
| `CLOUDWAPI_SENDER` | Worker secret | CloudWapi 發送方號碼 |
| `WEBHOOK_TOKEN` | Worker secret | Salesmartly Webhook 驗證 |
| `DB` (D1 binding) | wrangler.toml | 數據庫綁定 |
| `CARD_IMAGES` (R2) | wrangler.toml | 卡片圖片存儲桶 |

## 文件結構

```
JameStyle/
├── AGENTS.md                 # 本文件（Agent 維護指南）
├── README.md                 # 項目說明（面向人類貢獻者）
├── .build_src/               # 前端源碼（React + Vite + Tailwind）
│   ├── src/
│   │   ├── App.tsx           # 主流程控制
│   │   ├── components/       # React 組件
│   │   ├── data/slides.ts    # 15 張作品數據
│   │   ├── api/reactionsApi.ts
│   │   ├── store/appStore.ts
│   │   └── utils/            # 工具函數（achievements, soundManager）
│   ├── public/               # 靜態資源（images, cards, fonts）
│   └── dist/                 # Vite 構建輸出（自動生成）
├── .deploy_tmp/              # Cloudflare Pages 部署目錄（robocopy 鏡像）
├── backend/                  # Cloudflare Worker 後端
│   ├── src/
│   │   ├── index.ts          # Hono Worker 路由
│   │   ├── schema.ts         # Drizzle Schema
│   │   └── schema.sql        # 手動 SQL 備份
│   ├── migrations/           # D1 遷移文件
│   └── wrangler.toml         # Wrangler 配置
├── scripts/                  # 維護腳本
│   ├── generate_cards.py     # 預生成卡片（保留）
│   └── output_cards/         # 最新卡片輸出（保留）
└── .wrangler/                # Wrangler 本地緩存（可刪除）
```

**注意**：
- `.build_src` 根目錄及 `scripts/` 中**不應存在臨時 `.py` 腳本**
- `components/` 中不應存在未引用（孤兒）組件文件
- `output_cards/` 是預生成卡片的唯一輸出目錄，應與 `generate_cards.py` 保持同步

## 常用調試命令

```powershell
# 測試 Worker API
Invoke-RestMethod -Uri 'https://jamestyle-analytics.jimsbond007.workers.dev/api/public/analytics/summary' -Method GET

# 查詢 D1 數據庫
cd backend
$env:CLOUDFLARE_API_TOKEN = (Get-Content C:\Users\Owner\.wrangler\config.json | ConvertFrom-Json).api_token
pnpm exec wrangler d1 execute jamestyle-db --remote --command "SELECT COUNT(*) FROM device_metrics;"

# 測試卡片分享 API
$body = '{"slideId":5,"sessionId":"test"}'
Invoke-RestMethod -Uri 'https://jamestyle-analytics.jimsbond007.workers.dev/api/public/card-share/request' -Method POST -Body $body -ContentType 'application/json'

# 測試語錄 API
Invoke-RestMethod -Uri 'https://jamestyle-analytics.jimsbond007.workers.dev/api/public/quotes' -Method GET
Invoke-RestMethod -Uri 'https://jamestyle-analytics.jimsbond007.workers.dev/api/public/quote/9fz0/today' -Method GET

# 測試反應 API
$body = '{"reactionType":"like","sessionId":"test-session"}'
Invoke-RestMethod -Uri 'https://jamestyle-analytics.jimsbond007.workers.dev/api/public/quote/9fz0/react' -Method POST -Body $body -ContentType 'application/json'

# 測試訂閱 API
$body = '{"code":"9fz0","sessionId":"test-session"}'
Invoke-RestMethod -Uri 'https://jamestyle-analytics.jimsbond007.workers.dev/api/public/subscribe/request' -Method POST -Body $body -ContentType 'application/json'

# 更新 today_insights（需要 X-Admin-Token）
$body = '{"date":"2026-05-12","insights":[{"code":"9fz0","today_insight":"今日港股波動，正如人生直播。"}]}'
Invoke-RestMethod -Uri 'https://jamestyle-analytics.jimsbond007.workers.dev/api/admin/today-insights' -Method POST -Body $body -ContentType 'application/json' -Headers @{ "X-Admin-Token" = "jamestyle-admin-2025" }

# 清除緩存
Invoke-RestMethod -Uri 'https://jamestyle-analytics.jimsbond007.workers.dev/api/admin/purge-cache' -Method POST -Headers @{ "X-Admin-Token" = "jamestyle-admin-2025" }

# 數據重置
Invoke-RestMethod -Uri 'https://jamestyle-analytics.jimsbond007.workers.dev/api/admin/reset' -Method POST -Headers @{ "X-Reset-Token" = "jamesstyle-reset-2025" }
```
