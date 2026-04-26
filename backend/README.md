# JameStyle Analytics Backend

Cloudflare Worker (Hono + Drizzle ORM + D1 SQLite) 為 JameStyle 畫廊網站提供數據收集與分析 API。

## API 端點

### 公開 API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/` | Health check |
| GET | `/api/public/reactions` | 獲取所有反應統計 |
| POST | `/api/public/reactions` | 提交一條反應 |
| POST | `/api/public/sessions` | 創建訪客 session |
| PATCH | `/api/public/sessions/:id` | 更新 session 進度 |
| POST | `/api/public/events` | 提交單個行為事件 |
| POST | `/api/public/events/batch` | 批量提交事件 |
| POST | `/api/public/device-metrics` | 提交裝置信息 |

### 分析 API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/public/analytics/summary` | 總覽數據（訪客、反應、完成率） |
| GET | `/api/public/analytics/slide-heatmap` | 作品瀏覽與反應熱力 |
| GET | `/api/public/analytics/fan-scores` | 粉絲熱愛指數排行榜 |
| GET | `/api/public/analytics/timeline?days=30` | 時間趨勢 |
| GET | `/api/public/analytics/opening-funnel` | Opening 漏斗轉化 |
| GET | `/api/public/analytics/device` | 裝置數據聚合 |

### 管理 API

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/admin/reset` | 重置數據（需 RESET_TOKEN） |

## 數據庫 Schema

### reactions
記錄用戶對每張作品的反應（heart / like / share）。

### visitor_sessions
記錄每個訪客的 session，包含瀏覽進度、完成狀態、測試結果。

### visitor_events
記錄細粒度行為事件（page_view, slide_view, reaction, bubble_popped, opening_complete 等）。

### device_metrics
記錄訪客的裝置信息（屏幕、OS、瀏覽器、FCP、網絡類型等）。**收集所有裝置類型**。

## 本地開發

```bash
pnpm install
pnpm dev          # wrangler dev，本地 http://localhost:8787
```

## 部署

```bash
pnpm exec wrangler deploy --config=wrangler.toml
```

## D1 數據庫操作

```bash
# 執行遠程查詢
pnpm exec wrangler d1 execute jamestyle-db --remote --command "SELECT COUNT(*) FROM visitor_sessions;"

# 執行 SQL 文件
pnpm exec wrangler d1 execute jamestyle-db --remote --file=migrations/0001_initial.sql

# 應用遷移
pnpm exec wrangler d1 migrations apply jamestyle-db
```

## CORS 配置

見 `src/index.ts`。務必使用顯式 origin + `credentials: true`，不可用通配符 `*`。
