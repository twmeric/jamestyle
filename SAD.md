# JameStyle（阿占隨意）系統架構與設計文件

> **System Architecture & Design Document (SAD)**  
> **版本**: v1.0  
> **日期**: 2026-05-03  
> **項目**: JameStyle — 沉浸式互動畫廊網站  

---

## 目錄

1. [系統架構](#1-系統架構)
2. [前端架構](#2-前端架構)
3. [後端架構](#3-後端架構)
4. [數據庫設計](#4-數據庫設計)
5. [API 設計](#5-api-設計)
6. [數據流](#6-數據流)
7. [安全考量](#7-安全考量)
8. [部署架構](#8-部署架構)
9. [組件圖（文字描述）](#9-組件圖文字描述)

---

## 1. 系統架構

### 1.1 整體架構概覽

JameStyle 採用 **無服務器邊緣計算架構（Serverless Edge Architecture）**，全部基於 Cloudflare 平台構建，實現零服務器運維、全球 CDN 加速與極低延遲。

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              用戶端（Browser）                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   React 18  │  │  Zustand    │  │ EdgeSpark   │  │  Canvas/Web API │ │
│  │  (Vite+TW)  │  │   Store     │  │   Client    │  │ (Sound/Touch)   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────────────────┘ │
│         └─────────────────┴─────────────────┘                             │
│                           │ CORS + credentials                            │
└───────────────────────────┼─────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Cloudflare Workers（後端 API）                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Hono Framework + Drizzle ORM                                   │    │
│  │  ├─ 公開 API（analytics / reactions / sessions / events）        │    │
│  │  ├─ 卡片分享（card-share / unlock / download）                   │    │
│  │  ├─ Webhook（Salesmartly / WhatsApp）                           │    │
│  │  └─ 管理接口（admin reset / settings）                          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                           │                    │                        │
│                           ▼                    ▼                        │
│                   ┌──────────────┐    ┌──────────────┐                  │
│                   │  D1 SQLite   │    │   R2 Bucket  │                  │
│                   │  (結構化數據) │    │ (卡片圖片靜態託管) │               │
│                   └──────────────┘    └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼ Webhook
┌─────────────────────────────────────────────────────────────────────────┐
│                         第三方服務整合層                                  │
│  ┌─────────────────────┐          ┌─────────────────────────────────┐   │
│  │   Salesmartly       │◄────────►│        CloudWapi                │   │
│  │  (客服系統 852xxxx)  │  轉發訊息  │   (WhatsApp Business API)       │   │
│  └─────────────────────┘          │   - 主動推送圖片+文字             │   │
│                                   │   - 自動回覆感謝訊息              │   │
│                                   └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心設計原則

| 原則 | 說明 |
|------|------|
| **邊緣優先** | 靜態資源與 API 均部署於 Cloudflare 邊緣節點，確保全球低延遲 |
| **無狀態服務** | Worker 無本地狀態，所有狀態持久化至 D1 / R2 / localStorage |
| **事件驅動追蹤** | 用戶行為以事件流形式收集，支持批量與實時兩種模式 |
| **降級兼容** | API 調用失敗不阻塞主流程，前端以降級方式繼續運行 |
| **雙語支援** | 繁體中文（tc）與簡體中文（sc）雙語系，數據層使用英文 key |

---

## 2. 前端架構

### 2.1 技術棧

| 層級 | 技術 | 用途 |
|------|------|------|
| 框架 | React 18 + TypeScript | UI 組件與狀態渲染 |
| 構建 | Vite | 快速構建與 HMR |
| 樣式 | Tailwind CSS | 原子化 CSS |
| 動畫 | Framer Motion | 頁面轉場與組件動畫 |
| 狀態 | Zustand | 全局狀態管理 |
| API 客戶端 | EdgeSpark (`@edgespark/client`) | 自動攜帶 Auth Header 與 credentials |
| 音效 | Web Audio API + 自定義 SoundManager | BGM 與 SFX |
| 畫布 | HTML5 Canvas API | CollageGenerator 實時繪圖 |

### 2.2 應用流程（Phase Controller）

`App.tsx` 作為根組件，控制四個核心階段（phase）：

```
healing ──► opening ──► gallery ──► ending
  │           │           │           │
  ▼           ▼           ▼           ▼
呼吸動畫    過渡動畫    15張卡片     結尾頁+
煩惱氣泡    （可選）    滑動瀏覽     WhatsApp CTA
金句輪播                            CollageGenerator
「我哋出發」
```

### 2.3 核心組件職責

| 組件 | 職責 |
|------|------|
| `HealingIntro.tsx` | 6 階段開場動畫：breathing → bubbles → digest → slideshow → complete → exiting。支持氣泡戳破互動、自動/手動過渡 |
| `CardGallery.tsx` | 畫廊主體，淺色主題，4 種畫框風格（對應 4 act）。支持滑動/點擊導航、❤️/👍 反應、insight 展開、情緒投票（emotion vote） |
| `EndingScreen.tsx` | 結尾感謝頁，提供 WhatsApp 索取卡片入口、CollageGenerator 調用 |
| `CollageGenerator.tsx` | Canvas 實時繪製 1080×1080 PNG 卡片。Result step 僅顯示 quote；下載時輸出完整卡片（含 stamp） |
| `LangToggle.tsx` | 全局工具列：☰ 選單、🔊/🎵 音效控制、語言切換（tc/sc） |
| `AnalyticsDashboard.tsx` | 10-tab 數據後台：Summary、Heatmap、Fan Scores、Timeline、Opening Funnel、Device、Engagement、WhatsApp Leads、Conversion Funnel、Card Downloads。觸發方式：連按 `a` 鍵 3 次 |
| `AchievementToast.tsx` | 成就解鎖通知（左上角 `top-4 left-4`），healing `complete` 階段自動隱藏 |
| `TouchRipple.tsx` | 全局觸摸反饋特效 |
| `GlitchEffect.tsx` | 故障藝術視覺特效 |

### 2.4 狀態管理（Zustand）

`store/appStore.ts` 管理以下核心狀態：

```typescript
interface AppState {
  phase: 'healing' | 'opening' | 'gallery' | 'ending';  // 主流程階段
  lang: 'tc' | 'sc';                                    // 語言
  currentSlide: number;                                 // 當前卡片索引
  favorites: number[];                                  // 收藏列表
  reactions: Record<number, string[]>;                  // 本地反應記錄
  backendCounts: Record<number, Record<string, number>>;// 後端反應計數
  slidesViewed: Set<number>;                            // 已瀏覽卡片
  maxSlideReached: number;                              // 到達最遠卡片
  soundEnabled: boolean;                                // 音效開關
  emotionVotes: Record<number, string>;                 // 每張卡片的情緒投票
  isAutoPlaying: boolean;                               // 自動播放狀態
}
```

**持久化策略**：
- `localStorage` 持久化：`azhan_session_id`、`azhan_sound_enabled`、`azhan_emotion_votes`
- 後端持久化：reactions、events、sessions、device metrics

### 2.5 數據收集與追蹤

前端採用 **事件批處理（Event Batching）** 機制降低 API 調用頻率：

```
事件產生 ──► 寫入事件隊列 ──► 3秒定時 flush ──► POST /api/public/events/batch
     │                            │
     ▼                            ▼
重要事件（reaction/insight_open/  頁面關閉時透過
emotion_vote/share_click）      navigator.sendBeacon 可靠發送
 即時發送 POST /api/public/events
```

**性能指標收集**：
- FCP（First Contentful Paint）
- 觸摸延遲（touch latency）
- 裝置記憶體、連線類型、螢幕尺寸、像素比
- OS / Browser / Timezone / Orientation

### 2.6 音效系統

`utils/soundManager.ts` 管理：
- **BGM**：healing / gallery / ending 三階段背景音樂
- **SFX**：按鈕點擊、氣泡戳破、成就解鎖等音效
- 用戶可透過 LangToggle 全局開關音效，偏好寫入 `localStorage`

### 2.7 語錄畫廊（獨立靜態頁面）

`.build_src/public/gallery/index.html` 是一個完全獨立於 React 主應用的靜態頁面，負責 134 條語錄的展示：

**技術特點**：
- 純 HTML/CSS/JS，不依賴 React/Vite 構建流程中的 JS bundle
- 數據來源：`fetch('/gallery-data.json')` 加載 134 條語錄靜態 JSON
- today_insight 動態獲取：`fetch(API_BASE + '/api/public/quote/{code}/today')`
- 反應同步：通過 Worker API 讀寫 D1 `quote_reactions`

**畫框系統**：
- 10 種 CSS 畫框風格（由 `hashCode(code) % 10` 分配）
- 3D 翻轉效果：`perspective: 1200px` + `transform-style: preserve-3d`
- 自動翻回：5 秒延遲後自動翻回正面

**圖片優化**：
- `<picture>` 標籤提供 WebP / JPEG fallback
- WebP 通過 `scripts/convert_webp.py` 批量預生成

**Pages Functions SSR**：
- `.build_src/public/_worker.js` 作為 Pages Functions 入口
- 攔截 `/?code={code}` 請求，調用 Worker API 獲取語錄數據
- 返回帶有動態 OG 標籤的 HTML（og:title, og:description, og:image, twitter:card）
- 非 `?code=` 請求則透傳到靜態資源 `env.ASSETS.fetch(request)`

---

## 3. 後端架構

### 3.1 技術棧

| 層級 | 技術 | 用途 |
|------|------|------|
| 運行時 | Cloudflare Workers | 邊緣無服務器運算 |
| 框架 | Hono | 輕量級 Web 框架，支持 TypeScript |
| ORM | Drizzle ORM | D1 SQLite 類型安全操作 |
| 存儲 | D1 (SQLite) | 結構化數據持久化 |
| 對象存儲 | R2 (S3-compatible) | 預生成卡片 PNG 存儲 |
| 靜態託管 | Cloudflare Pages | 前端資產與卡片圖片託管 |

### 3.2 Worker 入口結構

`backend/src/index.ts` 採用模塊化路由設計，主要分為：

```
index.ts
├── CORS 中間件（顯式 origin，credentials: true）
├── Health Check (GET /)
├── Reactions API
├── Sessions API（POST / PATCH）
├── Events API（單條 + 批量）
├── Analytics Dashboard API（9+ 端點）
├── Device Metrics API
├── Card Share & Download API
├── Webhook Handlers（Salesmartly / WhatsApp）
├── CloudWapi Helpers（send message / send media）
├── Settings API
└── Admin API（reset）
```

### 3.3 核心業務邏輯

#### 3.3.1 反應系統
- 用戶點擊 ❤️ / 👍 時，前端即時更新本地狀態（Optimistic UI），同時發送 `POST /api/public/reactions`
- 後端將反應記錄至 `reactions` 表，並返回該 slide 的最新計數

#### 3.3.2 卡片分享流程
```
用戶點擊「WhatsApp 索取卡片」
  → POST /api/public/card-share/request (slideId, sessionId)
  → Worker 生成 16 位 shareToken，寫入 card_shares 表（status=pending）
  → 返回 WhatsApp deeplink（wa.me/{adminPhone}?text=預設訊息）
  → 用戶發送訊息至 Salesmartly
  → Salesmartly POST /api/webhooks/salesmartly
  → Worker 解析 slideId，匹配 card_shares 記錄，更新 status=completed
  → Worker 透過 CloudWapi 主動推送圖片 + 文字（含 dl/{token} 連結）
  → 用戶點擊連結進入 /dl/:token（語錄展示頁）
  → 點擊「解鎖高清卡片」→ GET /api/public/card-share/unlock/:token
  → 返回實際 PNG 下載 URL，更新 status=downloaded
```

#### 3.3.3 預生成卡片與 R2 映射
為防止 URL 被猜測，15 張卡片在 R2 中使用隨機文件名：

```typescript
const SLIDE_R2_MAP: Record<number, string> = {
  1: "x7k9m2p4.png", 2: "q3w8e5r1.png", /* ... */ 15: "e1r3t5y7.png"
};
```

靜態託管路徑：`https://jamestyle.com/cards/{r2_name}`

#### 3.3.4 Webhook 安全
- Salesmartly Webhook 透過事件格式校驗與 `event` / `data.from` 欄位驗證
- CloudWapi Webhook 支持 `?token=` 查詢參數驗證（對照 `WEBHOOK_TOKEN`）

---

## 4. 數據庫設計

### 4.1 概覽

數據庫採用 **Cloudflare D1（SQLite）**，ORM 使用 Drizzle。所有時間戳以 **Unix Epoch（秒）** 存儲，預設值為 `unixepoch()`。

### 4.2 表結構

#### `reactions` — 用戶反應
| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | INTEGER PK AI | 自增主鍵 |
| `slideId` | INTEGER NOT NULL | 作品編號（1-15） |
| `reactionType` | TEXT NOT NULL | 反應類型（heart / like / share 等） |
| `sessionId` | TEXT | 關聯的訪客 session |
| `createdAt` | INTEGER DEFAULT unixepoch() | 建立時間 |

#### `visitor_sessions` — 訪客會話
| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | TEXT PK | UUID，由前端生成並持久化於 localStorage |
| `fingerprint` | TEXT | 瀏覽器指紋 |
| `userAgent` | TEXT | UA 字串 |
| `referrer` | TEXT | 來源頁面 |
| `deviceType` | TEXT DEFAULT 'unknown' | mobile / tablet / desktop |
| `screenWidth` / `screenHeight` | INTEGER | 螢幕尺寸 |
| `language` | TEXT | 瀏覽器語言 |
| `sessionStart` / `lastActive` | INTEGER DEFAULT unixepoch() | 會話起止時間 |
| `totalSlidesViewed` | INTEGER DEFAULT 0 | 瀏覽卡片總數 |
| `maxSlideReached` | INTEGER DEFAULT 0 | 到達最遠卡片索引 |
| `completedGallery` | INTEGER DEFAULT 0 | 是否完成畫廊（0/1） |
| `tookQuiz` | INTEGER DEFAULT 0 | 是否參與測驗 |
| `quizResult` | INTEGER | 測驗結果類型 |

#### `visitor_events` — 行為事件流
| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | INTEGER PK AI | 自增主鍵 |
| `sessionId` | TEXT NOT NULL | 關聯 session |
| `eventType` | TEXT NOT NULL | 事件類型（slide_view / bubble_popped / insight_open / emotion_vote / sound_toggle / achievement_unlocked / card_share_request 等） |
| `slideId` | INTEGER | 關聯作品編號 |
| `eventData` | TEXT | JSON 序列化的附加數據 |
| `durationMs` | INTEGER | 事件持續時間（如 slide_view 的停留時長） |
| `createdAt` | INTEGER DEFAULT unixepoch() | 建立時間 |

#### `device_metrics` — 裝置指標
| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | INTEGER PK AI | 自增主鍵 |
| `sessionId` | TEXT NOT NULL | 關聯 session |
| `deviceType` | TEXT | 裝置類型 |
| `screenWidth` / `screenHeight` | INTEGER | 螢幕尺寸 |
| `devicePixelRatio` | INTEGER | 裝置像素比 |
| `orientation` | TEXT | portrait / landscape |
| `os` | TEXT | 操作系統 |
| `browser` | TEXT | 瀏覽器 |
| `fcpMs` | INTEGER | First Contentful Paint（毫秒） |
| `connectionType` | TEXT | 網絡連線類型 |
| `language` | TEXT | 語言 |
| `timezone` | TEXT | 時區 |
| `memoryGb` | INTEGER | 裝置記憶體（GB） |
| `touchLatencyMs` | INTEGER | 觸摸延遲 |
| `maxTouchPoints` | INTEGER | 最大觸摸點數 |
| `createdAt` | INTEGER DEFAULT unixepoch() | 建立時間 |

#### `card_shares` — 卡片分享記錄
| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | INTEGER PK AI | 自增主鍵 |
| `sessionId` | TEXT | 關聯 session |
| `slideId` | INTEGER NOT NULL | 作品編號 |
| `shareToken` | TEXT NOT NULL UNIQUE | 16 位隨機分享令牌 |
| `status` | TEXT DEFAULT 'pending' | pending / completed / downloaded |
| `phone` | TEXT | 用戶電話（如已知） |
| `sharedAt` | INTEGER | WhatsApp 確認時間 |
| `downloadedAt` | INTEGER | 實際下載時間 |
| `createdAt` | INTEGER DEFAULT unixepoch() | 建立時間 |

#### `whatsapp_leads` — WhatsApp 潛在客戶
| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | INTEGER PK AI | 自增主鍵 |
| `phone` | TEXT NOT NULL UNIQUE | 電話號碼 |
| `sessionId` | TEXT | 關聯 session |
| `shareToken` | TEXT | 關聯分享令牌 |
| `firstSlideId` | INTEGER | 首次請求的作品 |
| `cardUrl` | TEXT | 卡片頁面連結 |
| `firstContactAt` | INTEGER DEFAULT unixepoch() | 首次聯繫時間 |
| `source` | TEXT DEFAULT 'card_share' | 來源標記 |
| `shareCount` | INTEGER DEFAULT 1 | 分享次數 |
| `lastShareAt` | INTEGER | 最近分享時間 |
| `conversationHistory` | TEXT | JSON 序列化的對話歷史 |

#### `settings` — 動態配置
| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | INTEGER PK AI | 自增主鍵 |
| `key` | TEXT NOT NULL UNIQUE | 配置鍵 |
| `value` | TEXT | 配置值 |
| `updatedAt` | INTEGER DEFAULT unixepoch() | 更新時間 |

> **注意**：`settings` 表用於存儲運行時可變更的配置，例如 `admin_phone` 管理員電話。

#### `quotes` — 語錄數據（134 條）
| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | INTEGER PK AI | 自增主鍵 |
| `code` | TEXT NOT NULL UNIQUE | 4 位唯一代碼（如 "9fz0"） |
| `title` | TEXT NOT NULL | 語錄標題 |
| `caption` | TEXT NOT NULL | 語錄全文 |
| `insight` | TEXT NOT NULL | 固定解畫文字 |
| `image` | TEXT NOT NULL | 圖片路徑 |
| `today_insight` | TEXT | 每日更新的解畫（由 Agent 寫入） |
| `updated_at` | INTEGER DEFAULT unixepoch() | 最後更新時間 |
| `order_id` | INTEGER DEFAULT 0 | 排序編號 |

#### `quote_reactions` — 語錄反應
| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | INTEGER PK AI | 自增主鍵 |
| `quote_code` | TEXT NOT NULL | 關聯語錄代碼 |
| `reaction_type` | TEXT NOT NULL | like / love / laugh / wow / sad |
| `session_id` | TEXT NOT NULL | 訪客 session |
| `created_at` | INTEGER DEFAULT unixepoch() | 建立時間 |

#### `subscribers` — 語錄訂閱者
| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | INTEGER PK AI | 自增主鍵 |
| `phone` | TEXT | 電話號碼（訂閱確認後填入） |
| `name` | TEXT | 姓名（來自 Salesmartly） |
| `source_code` | TEXT | 來源語錄代碼 |
| `status` | TEXT DEFAULT 'pending' | pending / requested / confirmed |
| `created_at` | INTEGER DEFAULT unixepoch() | 建立時間 |

### 4.3 索引與查詢優化

雖然 D1 為輕量級 SQLite，但設計上已在高頻查詢欄位上隱含分組優勢：
- `visitor_events` 的 `eventType`、`slideId`、`sessionId` 用於聚合統計
- `card_shares` 的 `shareToken` 設有 UNIQUE 約束
- `whatsapp_leads` 的 `phone` 設有 UNIQUE 約束

---

## 5. API 設計

### 5.1 設計規範

- **Base URL**: `https://jamestyle-analytics.jimsbond007.workers.dev`
- **數據格式**: 統一返回 JSON，結構為 `{ data: ... }` 或 `{ error: ... }`
- **認證**: 公開 API 無需認證；管理 API 使用 `X-Reset-Token` Header
- **CORS**: `credentials: true`，允許的 origin 為顯式域名列表（禁止 `*`）

### 5.2 公開 API

#### 反應與互動
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/public/reactions` | 獲取所有反應分組統計 |
| POST | `/api/public/reactions` | 提交單條反應 |

#### 會話管理
| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/public/sessions` | 初始化或更新會話 |
| PATCH | `/api/public/sessions/:id` | 更新會話指標（slidesViewed / completedGallery 等） |

#### 事件追蹤
| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/public/events` | 單條事件上報（即時） |
| POST | `/api/public/events/batch` | 批量事件上報（3秒批處理） |

#### 裝置指標
| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/public/device-metrics` | 提交裝置與性能指標 |
| GET | `/api/public/analytics/device` | 獲取裝置分析報告 |

#### 卡片分享
| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/public/card-share/request` | 請求分享，生成 token 與 deeplink |
| GET | `/api/public/card-share/unlock/:token` | 解鎖下載，返回實際 PNG URL |
| GET | `/api/public/card-share/status/:token` | 查詢分享狀態 |

#### 卡片展示頁
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/dl/:token` | 語錄典藏 HTML 頁面（SSR HTML） |
| GET | `/api/public/card-download/:token` | API 形式的卡片頁面 |

#### 分析儀表板（Dashboard）
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/public/analytics/summary` | 總覽：會話數、反應數、完成率、裝置分佈、熱門作品 |
| GET | `/api/public/analytics/slide-heatmap` | 作品熱力圖：瀏覽數、平均停留、insight 展開次數、反應分佈 |
| GET | `/api/public/analytics/fan-scores` | 粉絲分層：superfan / loyal / active / regular / passerby |
| GET | `/api/public/analytics/timeline?days=30` | 時間軸：每日會話數與反應數 |
| GET | `/api/public/analytics/opening-funnel` | 開場轉化：各階段事件數、氣泡戳破統計 |
| GET | `/api/public/analytics/engagement` | 互動分析：emotionSpectrum、成就解鎖、音效開關率、collage 分享數 |
| GET | `/api/public/analytics/whatsapp-leads` | WhatsApp 潛客：總數、轉化漏斗、熱門作品、客戶旅程 |
| GET | `/api/public/analytics/conversion-funnel` | 轉化漏斗：瀏覽 → 反應 → 分享 → WhatsApp → 下載 |
| GET | `/api/public/analytics/card-downloads` | 卡片下載：總數、作品分佈、每日趨勢、下載率 |
| GET | `/api/public/analytics/customer-journey/:phone` | 單一客戶全旅程（lead + session + events + reactions + shares） |

#### 語錄畫廊（Quote Gallery）
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/public/quotes` | 獲取全部 134 條語錄列表 |
| GET | `/api/public/quote/:code` | 單條語錄詳情 |
| GET | `/api/public/quote/:code/today` | 獲取今日解畫（today_insight + updated_at） |
| POST | `/api/public/quote/:code/react` | 提交反應（reactionType: like/love/laugh/wow/sad） |
| GET | `/api/public/quote/:code/reactions` | 獲取該語錄的各反應聚合計數 |
| POST | `/api/public/subscribe/request` | 請求訂閱，返回 WhatsApp deeplink |

#### 配置
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/public/settings/:key` | 讀取單項配置 |

### 5.3 Webhook API

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/webhooks/salesmartly` | Salesmartly 訊息轉發，解析 slideId，回覆卡片連結，主動推送圖片 |
| POST | `/api/webhooks/whatsapp` | CloudWapi 訊息回調，記錄潛客對話歷史 |

### 5.4 管理 API

| 方法 | 路徑 | 說明 | 認證 |
|------|------|------|------|
| POST | `/api/admin/settings` | 更新動態配置 | `X-Reset-Token` |
| POST | `/api/admin/today-insights` | 批量更新 134 條語錄的 today_insight | `X-Admin-Token` |
| POST | `/api/admin/purge-cache` | 清除 Cloudflare CDN 緩存 | `X-Admin-Token` |
| POST | `/api/admin/reset` | **清空所有分析數據**（reactions / events / sessions / device_metrics / card_shares / whatsapp_leads） | `X-Reset-Token` |

### 5.5 EdgeSpark 兼容層

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/_es/config` | 返回禁用註冊與登入的配置（shim） |
| ALL | `/api/_es/auth/*` | 返回 404，屏蔽認證請求 |

---

## 6. 數據流

### 6.1 用戶旅程數據流

```
[用戶進入網站]
    │
    ▼
[前端: initTracking()]
    ├─ 生成/讀取 sessionId (localStorage)
    ├─ POST /api/public/sessions (指紋、UA、裝置類型、螢幕尺寸)
    ├─ POST /api/public/device-metrics (OS、Browser、FCP、連線類型、時區)
    └─ trackEvent('page_view')
    │
    ▼
[HealingIntro 階段]
    ├─ trackEvent('opening_breathing_start')
    ├─ trackEvent('bubble_popped', data: { label, isAuto })
    ├─ trackEvent('digest_complete')
    ├─ trackEvent('slideshow_start')
    └─ trackEvent('opening_complete')
    │
    ▼
[Gallery 階段]
    ├─ startSlideTimer(slideId) ──► 切換時計算 duration
    ├─ trackEvent('slide_change') ──► updateSession({ totalSlidesViewed, maxSlideReached })
    ├─ trackEventImmediate('insight_open')
    ├─ trackEventImmediate('reaction', data: { reactionType })
    ├─ trackEventImmediate('emotion_vote', data: { emotion })
    └─ trackEvent('slide_swipe', data: { direction, velocity })
    │
    ▼
[Ending 階段]
    ├─ setPhase('ending') ──► updateSession({ completedGallery: 1 })
    ├─ trackEvent('card_share_request') ──► POST /api/public/card-share/request
    └─ trackEvent('collage_share')
    │
    ▼
[WhatsApp 互動]
    ├─ 用戶發送訊息 ──► Salesmartly ──► POST /api/webhooks/salesmartly
    │                    Worker 解析 slideId，更新 card_shares + whatsapp_leads
    │                    CloudWapi 主動推送圖片 + 文字
    │
    └─ 用戶點擊 /dl/:token ──► 渲染語錄頁面
         點擊解鎖 ──► GET /api/public/card-share/unlock/:token
              更新 status=downloaded，返回 PNG URL
```

### 6.2 事件批處理數據流

```
用戶行為 ──► trackEvent() ──► 寫入內存隊列 (eventQueue[])
                                  │
                                  ├─ 首條事件觸發 scheduleFlush()
                                  │   └── setTimeout(flushEvents, 3000ms)
                                  │
                                  ├─ 重要事件繞過隊列，即時發送
                                  │   └── trackEventImmediate() → POST /api/public/events
                                  │
                                  └─ 頁面關閉前（beforeunload）
                                      └── navigator.sendBeacon → POST /api/public/events/batch
```

### 6.3 分析儀表板數據流

```
AnalyticsDashboard 加載
    │
    ├─ fetchAnalyticsSummary() ──► GET /api/public/analytics/summary
    ├─ fetchSlideHeatmap() ──► GET /api/public/analytics/slide-heatmap
    ├─ fetchFanScores() ──► GET /api/public/analytics/fan-scores
    ├─ fetchTimeline() ──► GET /api/public/analytics/timeline
    ├─ fetchOpeningFunnel() ──► GET /api/public/analytics/opening-funnel
    ├─ fetchDeviceAnalytics() ──► GET /api/public/analytics/device
    ├─ fetchEngagementAnalytics() ──► GET /api/public/analytics/engagement
    ├─ fetchWhatsAppLeads() ──► GET /api/public/analytics/whatsapp-leads
    ├─ fetchConversionFunnel() ──► GET /api/public/analytics/conversion-funnel
    └─ fetchCardDownloads() ──► GET /api/public/analytics/card-downloads
```

---

## 7. 安全考量

### 7.1 CORS 安全

- **絕對禁止使用 `origin: "*"`**，因 EdgeSpark client 使用 `credentials: 'include'`
- 顯式允許的 origin：
  - `https://jamestyle.com`
  - `https://www.jamestyle.com`
  - `https://159f699d.jamestyle.pages.dev`（預覽分支）
  - `http://localhost:5173`（本地開發）
- 允許方法：`GET`、`POST`、`PATCH`、`OPTIONS`
- 允許標頭：`Content-Type`、`Authorization`、`X-Reset-Token`

### 7.2 管理接口安全

- `/api/admin/reset` 與 `/api/admin/settings` 使用 **硬編碼 Token** 驗證（`X-Reset-Token: jamesstyle-reset-2025`）
- Token 透過 HTTPS 傳輸，不暴露於 URL 查詢參數
- Reset 接口會**永久刪除**所有分析數據，操作前無二次確認，需謹慎使用

### 7.3 卡片分享安全

- `shareToken` 為 16 位隨機字符串（`Math.random().toString(36)`），暴力猜測難度極高
- 卡片連結有效期 **30 分鐘**（`createdAt + 1800s`），過期後無法解鎖
- R2 文件名使用隨機映射（`SLIDE_R2_MAP`），防止直接訪問靜態資源

### 7.4 Webhook 安全

- `/api/webhooks/whatsapp` 支持 `?token=` 查詢參數驗證，對照環境變量 `WEBHOOK_TOKEN`
- `/api/webhooks/salesmartly` 校驗 `event` 與 `data.from` 欄位，過濾無效請求

### 7.5 數據隱私

- Session ID 由前端基於 `crypto.randomUUID()` 生成，無需個人身份信息
- WhatsApp 電話號碼僅在卡片分享流程中由用戶主動提供
- 裝置指標收集不包含 GPS、相機、麥克風等敏感權限
- 所有數據傳輸均透過 HTTPS

### 7.6 中文編碼問題

Cloudflare Worker 運行時對 TypeScript 源文件中的**中文硬編碼字符串**處理不穩定。後端 API 返回的枚舉值統一使用**英文 key**，前端負責映射到中文標籤。

---

## 8. 部署架構

### 8.1 部署目標

| 資產 | 平台 | 域名 / 端點 |
|------|------|------------|
| 前端靜態站 | Cloudflare Pages | `https://jamestyle.com` |
| 後端 API | Cloudflare Workers | `https://jamestyle-analytics.jimsbond007.workers.dev` |
| 數據庫 | Cloudflare D1 | `jamestyle-db` |
| 圖片存儲 | Cloudflare R2 | `jamestyle-cards` / `CARD_IMAGES` binding |

### 8.2 構建與部署流程

```powershell
# 1. 前端構建
cd .build_src && pnpm run build

# 2. 鏡像同步靜態資源至部署目錄
robocopy .build_src\dist .deploy_tmp /MIR

# 3. 部署前端（Cloudflare Pages）
cd backend
$env:CLOUDFLARE_API_TOKEN = (Get-Content ~/.wrangler/config.json | ConvertFrom-Json).api_token
pnpm exec wrangler pages deploy ..\.deploy_tmp --project-name=jamestyle --branch=main

# 4. 部署後端（Cloudflare Worker）
pnpm exec wrangler deploy --config=wrangler.toml
```

### 8.3 預生成卡片更新流程

```powershell
# 1. Python 生成卡片
cd scripts && python generate_cards.py

# 2. 同步至前端 public 目錄
robocopy scripts\output_cards .build_src\public\cards /MIR

# 3. 上傳至 R2（WhatsApp 下載來源）
cd backend
# 使用 wrangler r2 object put 上傳，文件名對照 SLIDE_R2_MAP

# 4. 重新構建並部署前端
```

### 8.3b WebP 圖片更新流程

```powershell
# 1. 將新 JPEG 放入 .build_src/public/gallery-images/
# 2. 執行批量轉換
cd scripts && python convert_webp.py
# 3. 重新構建並部署前端
cd ..\.build_src && pnpm run build
robocopy .build_src\dist .deploy_tmp /MIR
cd backend
$env:CLOUDFLARE_API_TOKEN = (Get-Content C:\Users\Owner\.wrangler\config.json | ConvertFrom-Json).api_token
pnpm exec wrangler pages deploy ..\.deploy_tmp --project-name=jamestyle --branch=main
```

### 8.3c Pages Functions SSR

`_worker.js` 位於部署目錄根目錄，由 Cloudflare Pages 在邊緣執行：
- **職責**：攔截 `/?code={code}` 請求，調用 Worker API 獲取語錄數據，返回帶動態 OG 標籤的 HTML
- **回退**：所有其他請求透傳至 `env.ASSETS.fetch(request)`（靜態文件服務）
- **部署**：隨 Pages 部署自動上線，無需單獨配置

### 8.4 環境變量

| 變量 | 位置 | 用途 |
|------|------|------|
| `CLOUDFLARE_API_TOKEN` | 本地環境 | Wrangler CLI 認證 |
| `RESET_TOKEN` | Worker Secret | 管理接口重置驗證 |
| `ADMIN_WHATSAPP` | Worker Secret | WhatsApp 客服號碼（預設 85268810677） |
| `CLOUDWAPI_KEY` | Worker Secret | CloudWapi API Key |
| `CLOUDWAPI_SENDER` | Worker Secret | CloudWapi 發送方號碼 |
| `WEBHOOK_TOKEN` | Worker Secret | Webhook 請求驗證 |
| `DB` | wrangler.toml | D1 數據庫綁定 |
| `CARD_IMAGES` | wrangler.toml | R2 存儲桶綁定 |

### 8.5 緩存策略

- Cloudflare Pages 自動啟用 CDN 緩存
- 卡片圖片設置 `Cache-Control: public, max-age=86400`
- 部署後若用戶看到舊版本，需**硬刷新**（`Ctrl+Shift+R`）

---

## 9. 組件圖（文字描述）

### 9.1 頂層系統組件

```
┌─────────────────────────────────────────────────────────────────┐
│                        JameStyle 系統                            │
│  ┌─────────────────────┐      ┌─────────────────────────────┐  │
│  │   前端應用層         │      │      後端服務層              │  │
│  │  (Cloudflare Pages) │◄────►│   (Cloudflare Workers)      │  │
│  │                     │ CORS │                             │  │
│  │  ┌───────────────┐  │      │  ┌───────────────────────┐  │  │
│  │  │ App.tsx       │  │      │  │ Hono Router           │  │  │
│  │  │ ├─Phase Ctrl  │  │      │  │ ├─CORS Middleware     │  │  │
│  │  │ ├─Music Sync  │  │      │  │ ├─Public API Routes   │  │  │
│  │  │ └─Analytics   │  │      │  │ ├─Webhook Handlers    │  │  │
│  │  └───────────────┘  │      │  │ ├─Card Share Logic    │  │  │
│  │                     │      │  │ └─Admin Routes        │  │  │
│  │  ┌───────────────┐  │      │  └───────────────────────┘  │  │
│  │  │ Zustand Store │  │      │                             │  │
│  │  │ ├─State       │  │      │  ┌───────────────────────┐  │  │
│  │  │ ├─Tracking    │  │      │  │ Drizzle ORM           │  │  │
│  │  │ └─Persistence │  │      │  │ ├─Schema Definitions  │  │  │
│  │  └───────────────┘  │      │  │ └─Query Builders      │  │  │
│  │                     │      │  └───────────────────────┘  │  │
│  │  ┌───────────────┐  │      │                             │  │
│  │  │ EdgeSpark     │  │      │  ┌───────────────────────┐  │  │
│  │  │ Client        │  │      │  │ External Integrations │  │  │
│  │  │ (API Fetch)   │  │      │  │ ├─Salesmartly Webhook │  │  │
│  │  └───────────────┘  │      │  │ ├─CloudWapi WhatsApp  │  │  │
│  │                     │      │  │ └─R2 Image Proxy      │  │  │
│  └─────────────────────┘      │  └───────────────────────┘  │  │
│                               └─────────────────────────────┘  │
│                                         │                      │
│                               ┌─────────┴─────────┐            │
│                               ▼                   ▼            │
│                         ┌──────────┐       ┌──────────┐        │
│                         │ D1 (SQLite)│      │ R2 (S3)  │        │
│                         │          │      │          │        │
│                         │ reactions│      │ cards/   │        │
│                         │ sessions │      │ temp/    │        │
│                         │ events   │      └──────────┘        │
│                         │ device   │                          │
│                         │ shares   │                          │
│                         │ leads    │                          │
│                         └──────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 前端組件層次

```
App.tsx (Root)
│
├─ HealingIntro.tsx
│   ├─ BreathingAnimation
│   ├─ BubbleInteraction (可戳破氣泡)
│   ├─ DigestQuotes
│   ├─ SlideshowPreview
│   └─ CompleteCTA (「我哋出發」)
│
├─ Opening.tsx (過渡動畫)
│
├─ CardGallery.tsx
│   ├─ SlideFrame (4 種畫框樣式)
│   ├─ ReactionBar (❤️ / 👍)
│   ├─ InsightPanel (洞察展開)
│   ├─ EmotionVote (情緒投票)
│   ├─ ProgressBar
│   └─ SwipeHandler (觸摸/滑動)
│
├─ EndingScreen.tsx
│   ├─ WhatsAppCTA
│   └─ CollageGenerator Trigger
│
├─ CollageGenerator.tsx (Modal)
│   ├─ CanvasRenderer (1080×1080)
│   ├─ QuoteStep (僅顯示文字)
│   └─ DownloadStep (輸出 PNG)
│
├─ LangToggle.tsx
│   ├─ MenuButton
│   ├─ SoundToggle
│   ├─ BGMToggle
│   └─ LanguageSwitch (tc/sc)
│
├─ AnalyticsDashboard.tsx (10 Tabs)
│   ├─ SummaryTab
│   ├─ HeatmapTab
│   ├─ FanScoresTab
│   ├─ TimelineTab
│   ├─ OpeningFunnelTab
│   ├─ DeviceTab
│   ├─ EngagementTab
│   ├─ WhatsAppLeadsTab
│   ├─ ConversionFunnelTab
│   └─ CardDownloadsTab
│
├─ AchievementToast.tsx
├─ TouchRipple.tsx
└─ GlitchEffect.tsx
```

### 9.3 後端路由層次

```
Hono App
│
├─ Middleware
│   └─ CORS (顯式 origin，credentials)
│
├─ Public Routes
│   ├─ /api/public/reactions (GET/POST)
│   ├─ /api/public/sessions (POST / PATCH)
│   ├─ /api/public/events (POST / batch)
│   ├─ /api/public/device-metrics (POST)
│   ├─ /api/public/card-share/request (POST)
│   ├─ /api/public/card-share/unlock/:token (GET)
│   ├─ /api/public/card-share/status/:token (GET)
│   ├─ /api/public/card-image/:filename (GET / R2 Proxy)
│   └─ /api/public/analytics/* (9+ GET endpoints)
│
├─ Webhook Routes
│   ├─ /api/webhooks/salesmartly (POST)
│   └─ /api/webhooks/whatsapp (POST)
│
├─ Page Routes
│   ├─ /dl/:token (GET / HTML SSR)
│   └─ /api/public/card-download/:token (GET)
│
├─ Admin Routes
│   ├─ /api/admin/settings (POST)
│   └─ /api/admin/reset (POST)
│
└─ Compatibility Routes
    ├─ /api/_es/config (GET)
    └─ /api/_es/auth/* (ALL / 404)
```

---

## 附錄

### A. 數據實體關係圖（ERD，文字描述）

```
visitor_sessions (1) ────< (N) visitor_events
     │                           │
     │                           ├─ slideId → SLIDES (邏輯關聯)
     │                           └─ eventData (JSON)
     │
     ├────< (N) reactions ────── slideId
     │
     ├────< (N) device_metrics
     │
     └────< (N) card_shares ──── slideId
              │
              └─ shareToken ────> /dl/:token
              │
              └─ phone ─────────> whatsapp_leads (1:1)

whatsapp_leads (1) ──────< (N) conversationHistory (JSON)
```

### B. 縮寫詞彙表

| 縮寫 | 全稱 | 說明 |
|------|------|------|
| SAD | System Architecture & Design | 系統架構與設計文件 |
| CORS | Cross-Origin Resource Sharing | 跨來源資源共享 |
| FCP | First Contentful Paint | 首次內容繪製時間 |
| BGM | Background Music | 背景音樂 |
| SFX | Sound Effects | 音效 |
| SSR | Server-Side Rendering | 伺服器端渲染 |
| ORM | Object-Relational Mapping | 對象關係映射 |
| CDN | Content Delivery Network | 內容分發網絡 |
| UA | User-Agent | 用戶代理字串 |
| CTA | Call to Action | 行動號召 |
