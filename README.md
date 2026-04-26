# 阿占隨意 James Style

> 一個沉浸式互動畫廊網站，結合 15 張生活語錄插畫、治癒開場動畫、性格測試與數據分析後台。

## 線上環境

| 服務 | 網址 |
|------|------|
| 前端網站 | https://jamestyle.com |
| Analytics Worker | https://jamestyle-analytics.jimsbond007.workers.dev |

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端 | React 18 + Vite 7 + Tailwind CSS 3 + Framer Motion + Zustand |
| 後端 | Cloudflare Workers (Hono) + Drizzle ORM + D1 SQLite |
| 部署 | Cloudflare Pages (前端) + Cloudflare Workers (後端 API) |
| 包管理 | pnpm v10.32.1 |

## 項目結構

```
JameStyle/
├── .build_src/          # 前端源代碼 (React + Vite)
│   ├── src/
│   │   ├── components/  # React 組件
│   │   ├── api/         # API 客戶端 (reactionsApi.ts)
│   │   ├── store/       # Zustand 狀態管理
│   │   └── App.tsx
│   └── public/          # 靜態資源 (圖片、字體)
├── backend/             # Cloudflare Worker 後端
│   ├── src/
│   │   ├── index.ts     # API 路由
│   │   └── schema.ts    # D1 數據庫 Schema
│   └── migrations/      # D1 SQL 遷移
├── scripts/             # 調試/檢查腳本 (Python)
└── .deploy_tmp/         # 前端部署臨時目錄 (自動生成)
```

## 快速開始

### 前置需求
- Node.js 18+
- pnpm `npm install -g pnpm`
- Cloudflare Wrangler CLI

### 本地開發

```bash
# 前端開發服務器
cd .build_src
pnpm install
pnpm dev          # http://localhost:5173

# 後端開發服務器
cd backend
pnpm install
pnpm dev          # http://localhost:8787
```

### 構建與部署

```bash
# 1. 構建前端
cd .build_src
pnpm run build

# 2. 複製到部署目錄
robocopy .build_src\dist .deploy_tmp /MIR

# 3. 部署前端到 Cloudflare Pages
cd backend
pnpm exec wrangler pages deploy ..\.deploy_tmp --project-name=jamestyle --branch=main

# 4. 部署後端 Worker
cd backend
pnpm exec wrangler deploy --config=wrangler.toml
```

## 數據分析後台

在網站任意頁面 **快速連按 `a` 鍵 3 次**，即可打開隱藏的分析儀表板。

支持的數據維度：
- 總覽：訪客數、反應數、完成率、裝置分佈
- Opening 漏斗：開場動畫各階段轉化
- 作品熱力：每張作品的瀏覽與反應數據
- 粉絲指數：訪客熱愛指數排行榜
- 趨勢：每日訪客與反應趨勢
- 裝置數據：屏幕尺寸、OS、瀏覽器、FCP 等

## 數據庫

使用 Cloudflare D1 (SQLite)。Schema 定義在 `backend/src/schema.ts`，遷移文件在 `backend/migrations/`。

```bash
# 查看遠程數據庫記錄數
cd backend
pnpm exec wrangler d1 execute jamestyle-db --remote --command "SELECT COUNT(*) FROM visitor_sessions;"
```

## 授權

© 阿占隨意 James Style. All rights reserved.
