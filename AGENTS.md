# JameStyle — Agent 維護指南

## 項目概覽

這是一個**沉浸式互動畫廊網站**，核心流程：

1. **Healing Intro** (30s) — 呼吸動畫 → 煩惱氣泡 → 消化金句 → 輪播預告 → 完成
2. **Card Gallery** — 15 張作品卡片，支持滑動/點擊瀏覽
3. **Ending Screen** — 結尾感謝頁 + 性格測試
4. **Analytics Dashboard** — 隱藏數據後台（按 `a` 3 次觸發）

## 架構

```
┌─────────────────┐     CORS + credentials     ┌─────────────────────────────┐
│  Cloudflare     │  ───────────────────────►  │  Cloudflare Worker          │
│  Pages (靜態)   │                            │  jamestyle-analytics        │
│  jamestyle.com  │  ◄──────────────────────── │  D1 SQLite 數據庫           │
└─────────────────┘     JSON { data: ... }     └─────────────────────────────┘
```

- **前端** 使用 EdgeSpark (`@edgespark/client`) 的 `client.api.fetch()` 發送請求
- `client.api.fetch` **自動攜帶 `Authorization` header 和 `credentials: 'include'`**
- 因此 Worker CORS **必須**設置 `credentials: true` 且 `origin` **不能是 `*`**

## 關鍵文件

| 文件 | 職責 |
|------|------|
| `.build_src/src/App.tsx` | 主應用流程控制（phase: healing → opening → gallery → ending） |
| `.build_src/src/components/HealingIntro.tsx` | 開場動畫（5 階段，含氣泡、金句、輪播） |
| `.build_src/src/components/AnalyticsDashboard.tsx` | 數據後台（6 個 Tab） |
| `.build_src/src/api/reactionsApi.ts` | 所有 API 調用 + session 管理 |
| `.build_src/src/store/appStore.ts` | Zustand 狀態（phase, lang, slide, tracking） |
| `.build_src/src/components/slides.ts` | 15 張作品的數據（caption, emoji, image） |
| `backend/src/index.ts` | Worker API 路由（15+ 端點） |
| `backend/src/schema.ts` | D1 數據庫 Schema（4 張表） |

## 構建與部署

```bash
# 前端構建
cd .build_src && pnpm run build

# 複製到部署目錄
robocopy .build_src\dist .deploy_tmp /MIR

# 部署前端 (Cloudflare Pages)
cd backend && pnpm exec wrangler pages deploy ..\.deploy_tmp --project-name=jamestyle --branch=main

# 部署後端 (Cloudflare Worker)
cd backend && pnpm exec wrangler deploy --config=wrangler.toml
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

**解決方案**：後端 API 返回的枚舉值（如粉絲等級 tier）統一使用**英文 key**，前端負責映射到中文標籤。

```typescript
// 後端 — 只用英文 key
const getTier = (score: number) => {
  if (score >= 80) return { key: 'superfan', label: '鐵粉' };
  if (score >= 60) return { key: 'loyal', label: '忠實粉絲' };
  // ...
};

// 前端 — 英文 key → 中文
const tierLabels = {
  superfan: t('鐵粉', '铁粉'),
  loyal: t('忠實粉絲', '忠实粉丝'),
  // ...
};
```

### 3. Analytics Dashboard 觸發
用戶在任意頁面快速連按 `a` 鍵 3 次（1 秒內），`App.tsx` 中的 keydown listener 會切換 `showAnalytics` 狀態。

### 4. 裝置數據收集
`appStore.ts` 的 `initTracking()` 在每次頁面加載時向 `POST /api/public/device-metrics` 發送裝置信息（屏幕尺寸、OS、瀏覽器、FCP 等），**不區分裝置類型**（PC / 手機 / 平板都會收集）。

### 5. 表名歷史
原表名 `mobile_metrics` 已更名為 `device_metrics`。舊表保留在數據庫中但不再使用。

### 6. 緩存策略
Cloudflare Pages 有 CDN 緩存。部署後如果用戶看到舊版本，需要**硬刷新** (`Ctrl+Shift+R`)。

### 7. 新增 D1 表
D1 不會自動根據 Drizzle schema 創建表。新增表後需要手動執行 SQL：

```bash
cd backend
pnpm exec wrangler d1 execute jamestyle-db --remote --file=migrations/xxxx.sql
```

## 環境變量

| 變量 | 位置 | 說明 |
|------|------|------|
| `CLOUDFLARE_API_TOKEN` | 本地環境 | Wrangler 部署所需 |
| `RESET_TOKEN` | Worker secret | 後台重置接口驗證 |
| `DB` (D1 binding) | wrangler.toml | 數據庫綁定 |

## 常用調試命令

```bash
# 測試 Worker API
Invoke-RestMethod -Uri 'https://jamestyle-analytics.jimsbond007.workers.dev/api/public/analytics/summary' -Method GET

# 查詢 D1 數據庫
cd backend
pnpm exec wrangler d1 execute jamestyle-db --remote --command "SELECT COUNT(*) FROM device_metrics;"
```
