# JameStyle（阿占隨意）產品需求文件

**版本**：v1.0  
**日期**：2026-05-03  
**狀態**：已上線（Production）  
**文件類型**：Product Requirements Document（PRD）

---

## 目錄

1. [產品概述](#1-產品概述)
2. [用戶故事](#2-用戶故事)
3. [核心功能](#3-核心功能)
4. [用戶流程](#4-用戶流程)
5. [數據追蹤需求](#5-數據追蹤需求)
6. [非功能需求](#6-非功能需求)
7. [未來擴展](#7-未來擴展)

---

## 1. 產品概述

### 1.1 產品定位

JameStyle（阿占隨意）是一款**沉浸式互動畫廊網站**，以 15 張原創生活語錄插畫為核心內容，結合療癒開場動畫、情緒光譜投票、個性測驗及 WhatsApp 卡片分享，打造介於「數位展覽」與「心靈療癒」之間的獨特體驗。

網站以輕盈的暖色調畫廊美學為基底，讓用戶在 3–5 分鐘的瀏覽過程中，透過互動獲得情緒共鳴與社交分享素材。

### 1.2 目標用戶

| 用戶類型 | 特徵 | 使用動機 |
|---------|------|---------|
| 一般訪客 | 透過社交媒體連結進入 | 好奇、打發時間、尋找共鳴金句 |
| 深度讀者 | 完整瀏覽全部 15 張作品 | 喜歡語錄文化、收集金句 |
| 分享者 | 主動使用 WhatsApp 索取卡片 | 想轉發给朋友、用作社交媒體素材 |
| 回流用戶 | 多次訪問 | 追蹤新內容、解鎖成就 |

### 1.3 價值主張

- **情緒價值**：每張作品附帶「洞察語句」，引導用戶從幽默或諷刺中獲得療癒
- **互動價值**：非線性瀏覽、情緒投票、成就解鎖，提升參與感
- **社交價值**：一鍵生成專屬語錄卡片，透過 WhatsApp 分享並追蹤下載

### 1.4 技術架構

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

| 層級 | 技術棧 |
|-----|--------|
| 前端 | React 18 + Vite 7 + Tailwind CSS 3 + Framer Motion + Zustand |
| 後端 | Cloudflare Workers（Hono）+ Drizzle ORM + D1 SQLite + R2 |
| 部署 | Cloudflare Pages + Workers |
| 第三方 | EdgeSpark Client、Salesmartly、CloudWapi |

---

## 2. 用戶故事

### 2.1 療癒開場

> **作為** 初次訪問的用戶，  
> **我想** 在進入畫廊前有一段沉澱心情的儀式感動畫，  
> **如此** 我才能從煩躁的狀態轉換到適合欣賞作品的平靜心境。

**驗收標準**：
- 開場包含呼吸引導、可戳破的煩惱氣泡、消化金句、輪播預告四個階段
- 總時長約 35 秒，可選擇跳過
- 播放輕柔環境音樂，可隨時關閉

### 2.2 畫廊瀏覽

> **作為** 畫廊訪客，  
> **我想** 像逛美術館一樣滑動瀏覽作品，  
> **如此** 我能欣賞不同風格的畫框與插畫，並為喜歡的作品留下反應。

**驗收標準**：
- 15 張作品分為 4 個 Act，每個 Act 擁有獨特畫框風格
- 支持滑動（Swipe）與點擊切換
- 每張作品顯示情緒投票按鈕（❤️感動、😂好笑、🍵療癒、💡共鳴）與 👍 Like
- 已移除「收藏 / Favorite」功能

### 2.3 情緒表達

> **作為** 與作品產生共鳴的用戶，  
> **我想** 用直覺的表情符號表達當下感受，  
> **如此** 我能參與集體情緒光譜，看到其他人的反應分佈。

**驗收標準**：
- 四種情緒反應 + Like 按鈕，點擊即記錄
- 顯示該作品的即時反應總數（來自後端數據）
- 同一用戶可對同一作品投多個情緒，但同一情緒僅記錄一次

### 2.4 卡片索取

> **作為** 想分享作品的用戶，  
> **我想** 透過 WhatsApp 索取高解析度語錄卡片，  
> **如此** 我能下載 PNG 並分享到社交媒體或發給朋友。

**驗收標準**：
- 點擊「索取卡片」後進入 CollageGenerator
- CollageGenerator 結果頁**僅顯示語錄文字 + 作品標題 + WhatsApp 按鈕**，**不顯示 PNG 預覽**
- 點擊 WhatsApp 按鈕後開啟 deeplink，預填訊息包含作品編號與標題
- 用戶發送訊息後，Salesmartly 自動回覆下載連結（/dl/:token）
- 下載頁**僅顯示語錄文字 + 解鎖按鈕**，**不顯示圖片**
- 解鎖後生成 1080×1080 PNG（Canvas 實時繪製），附帶動態日期印章

### 2.5 成就解鎖

> **作為** 回流用戶，  
> **我想** 獲得瀏覽行為的成就獎勵，  
> **如此** 我有動力再次訪問並探索更多內容。

**驗收標準**：
- 9 項成就，包含慢讀者、氣泡戳破者、回頭客、夜貓子、連續訪問、聲音探索者、拼貼藝術家、情緒投票者、完覽畫廊
- 成就解鎖時左上角顯示 Toast 通知
- Healing Intro 進入 complete 階段時自動隱藏成就通知

### 2.6 數據後台

> **作為** 網站運營者，  
> **我想** 隱蔽地查看訪客數據與轉化漏斗，  
> **如此** 我能了解用戶行為並優化內容。

**驗收標準**：
- 快速連按 `a` 鍵 3 次觸發 Analytics Dashboard
- 9 個分頁：總覽、熱力圖、粉絲分層、時間軸、開場漏斗、裝置分析、互動分析、WhatsApp 潛客、轉化漏斗
- 提供一鍵重置數據功能（需驗證 Token）

---

## 3. 核心功能

### 3.1 療癒開場（Healing Intro）

開場為單頁沉浸式全螢幕動畫，共分 6 個階段，總時長約 35 秒：

| 階段 | 名稱 | 時長 | 內容描述 |
|-----|------|------|---------|
| 1 | Breathing | ~8s | 中心圓形呼吸動畫，引導吸氣 / 呼氣 |
| 2 | Bubbles | ~10s | 6 個煩惱氣泡從底部浮起，用戶可點擊戳破，氣泡內含煩惱文字（如「工作壓力」、「人際關係」） |
| 3 | Digest | ~6s | 金句浮現：「讓這些話，替你消化一點煩惱」 |
| 4 | Slideshow | ~8s | 3 張作品快速預覽輪播，製造期待感 |
| 5 | Complete | ~3s | 顯示「我哋出發」按鈕，點擊進入畫廊 |
| 6 | Exiting | 過渡 | 淡出至 Opening 動畫 |

**視覺風格**：
- 深色背景（`#1a1a1a`）配暖金色（`#C4956A`）裝飾線條
- 四角 L 形裝飾線（Hermes 風格）
- 細微顆粒噪點覆層（opacity 0.025）增添質感
- Framer Motion 彈簧物理動畫

**音效**：
- 背景播放療癒環境音（`healing` 頻道）
- 戳破氣泡時播放 `playBubblePop()` 音效
- 可透過右上角語言切換列關閉 / 開啟音效

**互動細節**：
- 戳破氣泡解鎖 `bubble_popper` 成就
- 開啟音效解鎖 `sound_on` 成就
- 夜間（00:00–05:00）訪問解鎖 `night_owl` 成就

### 3.2 畫廊瀏覽（Card Gallery）

畫廊為核心內容區，展示 15 張作品卡片，支持多種導航方式：

#### 3.2.1 作品數據結構

```typescript
interface Slide {
  id: number;           // 1–15
  img: string;          // 插畫圖片路徑
  caption: { tc: string; sc: string };   // 主語錄（繁體 / 簡體）
  insight: { tc: string; sc: string };   // 洞察語句
  title: { tc: string; sc: string };     // 作品標題
  act: number;          // 0–3，對應四大主題
  emoji: string;        // 主題代表 Emoji
  reactions: { heart: number; like: number; share: number };  // 預設種子數據
}
```

#### 3.2.2 15 張作品清單

| 編號 | 標題（繁體） | Act | 主題 |
|-----|------------|-----|------|
| 1 | 人生大便 | 0 | 共鳴幽默 |
| 2 | 包與剪 | 0 | 共鳴幽默 |
| 3 | 鬥快啲 | 0 | 共鳴幽默 |
| 4 | 令自己笑 | 1 | 溫柔治癒 |
| 5 | 唔好太用腦 | 1 | 溫柔治癒 |
| 6 | 開心鴨力 | 1 | 溫柔治癒 |
| 7 | 命運論 | 2 | 人生態度 |
| 8 | 開一眼閉一眼 | 2 | 人生態度 |
| 9 | 自己主角 | 2 | 人生態度 |
| 10 | 一二淡化 | 3 | 個性派 |
| 11 | 三萬天 | 3 | 個性派 |
| 12 | 搵架罌味飯 | 3 | 個性派 |
| 13 | 被討厭定律 | 3 | 個性派 |
| 14 | 擋風遮雨 | 3 | 個性派 |
| 15 | 一萬次練習 | 3 | 個性派 |

#### 3.2.3 四大畫框風格

每個 Act 擁有獨特的畫框視覺風格，模擬真實美術館的陳列差異：

| Act | 主題名稱 | 畫框風格 | 邊框色 | 陰影效果 |
|-----|---------|---------|--------|---------|
| 0 | 共鳴幽默 | Bold Modern Black | `#1a1a1a` 5px | 硬邊陰影 |
| 1 | 溫柔治癒 | Warm Wood | `#A67C52` 6px | 木紋內光暈 |
| 2 | 人生態度 | Fine Metallic Gold | `#C4956A` 1.5px | 雙層金邊 |
| 3 | 個性派 | Double-layer Shadow Box | `#2a2a2a` 3px | 內嵌 + 外投陰影 |

#### 3.2.4 切換動畫

畫廊內建 8 種隨機切換過渡動畫，每次切換卡片時隨機選用一種，保持新鮮感：

1. 經典水平滑入（Classic horizontal slide）
2. 底部彈起（Rise from below with bounce）
3. 縮放彈入（Scale zoom with bounce）
4. 扇形旋入（Rotate fan-in from right）
5. 對角滑入（Diagonal slide）
6. 3D 翻轉（3D flip rotateY）
7. 頂部落下（Drop from top）
8. 彈性水平過衝（Elastic horizontal with overshoot）

#### 3.2.5 導航方式

- **左右滑動**：手勢 Swipe（Framer Motion Pan）
- **點擊邊緣**：點擊畫面左 / 右側切換上 / 下一張
- **鍵盤導航**：左右方向鍵
- **自動播放**：每 5 秒自動切換（可開關）
- **進度條**：底部顯示目前位置（1/15）

### 3.3 情緒光譜投票

每張作品下方提供情緒反應區，讓用戶表達當下感受：

| 反應 | Emoji | 含義 | 後端 Key |
|-----|-------|------|---------|
| 感動 | ❤️ | 被語錄觸動心弦 | `heart` |
| 好笑 | 😂 | 覺得幽默風趣 | `funny` |
| 療癒 | 🍵 | 獲得心靈平靜 | `heal` |
| 共鳴 | 💡 | 深有同感 | `insight` |
| 讚好 | 👍 | 單純喜歡 | `like` |

**互動規則**：
- 點擊即發送後端記錄，同時播放對應音效
- 顯示該作品的即時總反應數（從後端 `reactions` 表統計）
- 同一 session 可對同一作品投多種情緒，但同一情緒不重複計數
- 首次投票解鎖 `emotion_voter` 成就

> **注意**：舊版曾包含「收藏（Favorite）」功能，現已**完全移除**，UI 與資料層均不再支援。

### 3.4 語錄卡片生成與分享

#### 3.4.1 CollageGenerator（前端組件）

用戶在畫廊中點擊「索取卡片」後進入 CollageGenerator 流程：

**步驟 1：選擇卡片**
- 顯示目前作品縮圖與標題
- 提供「生成卡片」按鈕

**步驟 2：結果頁（關鍵設計）**
- **僅顯示**：語錄文字（quote）+ 作品標題 + WhatsApp 索取按鈕
- **不顯示**：PNG 圖片預覽、Canvas 預覽、任何圖像元素
- 這是刻意設計，引導用戶必須透過 WhatsApp 完成分享閉環

**步驟 3：WhatsApp Deeplink**
- 點擊按鈕開啟 `https://wa.me/85262322466`
- 預填訊息格式：
  ```
  我想下載阿占語錄卡片 [圖片]
  第{slideId}號作品《{title}》
  來自 JameStyle.com
  ```

#### 3.4.2 後端卡片分享 API

| 端點 | 方法 | 說明 |
|-----|------|------|
| `/api/public/card-share/request` | POST | 創建 share token，返回 WhatsApp deeplink |

**流程**：
1. 前端發送 `slideId` + `sessionId`
2. Worker 創建 `card_shares` 記錄（status = `pending`）
3. 返回預填訊息的 WhatsApp deeplink
4. 用戶發送訊息至 Salesmartly（客服號：85262322466）
5. Salesmartly webhook → Worker 回覆卡片下載連結（`/dl/{token}`）
6. CloudWapi（如配置）主動推送卡片圖片

#### 3.4.3 下載頁（/dl/:token）

- **僅顯示**：語錄文字 + 作品標題 +「解鎖下載」按鈕
- **不顯示**：任何圖片或圖像預覽
- 點擊「解鎖」後，Canvas 實時繪製 1080×1080 PNG 並觸發瀏覽器下載
- 更新 `card_shares` status 為 `downloaded`

#### 3.4.4 印章設計規範

每張 PNG 右下角附帶動態日期印章：

| 屬性 | 規格 |
|-----|------|
| 半徑 | 80px（Python 預生成）/ 75px（Canvas 實時） |
| 位置 | 畫框右下角內約 2/3 半徑處（約 53px），約 1/3 在畫框外 |
| 字體 | JAMESTYLE 34px bold；日期 / 阿占隨意 18px |
| 旋轉 | 40° |
| 顏色 | 深灰墨水 `#4A4A4A`（RGB 74,74,74），透明度 0.85 |

### 3.5 結尾頁（Ending Screen）

用戶瀏覽完第 15 張作品後自動進入結尾頁，亦可從畫廊手動進入：

- **視覺**：深色背景 + 暖金裝飾線 + 中央 Avatar（logo）旋轉光環
- **統計**：顯示已瀏覽張數 / 15、互動次數
- **功能按鈕**：
  - 「重新瀏覽」——回到畫廊首張
  - 「WhatsApp 對話」——直接開啟 WhatsApp（https://wa.me/85268810677）
  - 「索取卡片」——開啟 CollageGenerator
- 完成畫廊解鎖 `gallery_complete` 成就

### 3.6 個性測驗（Quiz）

結尾頁或特定觸發點提供簡短個性測驗，根據用戶的瀏覽與反應行為，歸類為四種人格：

| 類型 | 名稱 | 描述 |
|-----|------|------|
| 0 | 共鳴幽默派 | 讓人笑中帶淚，溫柔又深刻 |
| 1 | 溫柔治癒系 | 用溫柔的方式讓身邊的人放鬆 |
| 2 | 人生哲學家 | 總能在平凡中看到不凡 |
| 3 | 個性派 | 獨一無二，活出自己的態度 |

測驗結果記錄於 `visitor_sessions.quiz_result`，解鎖對應成就。

### 3.7 成就系統

共 9 項成就，定義於 `achievements.ts`：

| ID | 名稱（繁體） | Emoji | 觸發條件 |
|----|------------|-------|---------|
| `slow_reader` | 慢活派 | 🐢 | 單張作品停留超過 30 秒 |
| `bubble_popper` | 氣泡終結者 | 🫧 | 在 Healing Intro 戳破至少一個氣泡 |
| `return_visitor` | 回頭客 | 🔄 | 第二次訪問（偵測 localStorage） |
| `night_owl` | 深夜讀者 | 🌙 | 凌晨 00:00–05:00 訪問 |
| `streak_3days` | 連續訪問 3 日 | 🔥 | 連續 3 天訪問網站 |
| `sound_on` | 聲音探索者 | 🔊 | 開啟背景音效 |
| `collage_creator` | 拼貼藝術家 | 🎨 | 使用 CollageGenerator 生成卡片 |
| `emotion_voter` | 情緒投票者 | 💭 | 首次對作品進行情緒投票 |
| `gallery_complete` | 完覽畫廊 | 🏆 | 瀏覽全部 15 張作品 |

**UI 表現**：
- 解鎖時左上角顯示 `AchievementToast`（滑入動畫，3 秒後自動消失）
- Healing Intro 進入 `complete` 階段時自動 dispatch `hide-achievement-toast`
- 成就狀態持久化於 `localStorage`

### 3.8 語言切換

支持繁體中文（TC）與簡體中文（SC）雙語：

- **切換位置**：右上角工具列（LangToggle 組件）
- **數據來源**：所有文案（語錄、洞察、標題、UI 文字）均內建雙語對象 `{ tc: string; sc: string }`
- **字體**：繁體使用「內海字體（naikai）」，簡體自動套用對應 fallback
- **後端**：API 返回枚舉值統一使用**英文 key**，前端負責映射到中文標籤（避免 Worker 中文編碼亂碼問題）

### 3.9 音效與背景音樂

| 功能 | 說明 |
|-----|------|
| 背景音樂 | 三首頻道：`healing`（開場）、`gallery`（畫廊）、`ending`（結尾） |
| 互動音效 | 氣泡戳破、反應按鈕點擊、切換卡片 |
| 控制 | 右上角喇叭圖示，一鍵靜音 / 開啟 |
| 狀態持久化 | 用戶偏好記錄於 Zustand store 與 localStorage |

### 3.10 數據分析後台（Analytics Dashboard）

隱藏式管理後台，僅供運營者使用：

**觸發方式**：1 秒內快速連按 `a` 鍵 3 次

**9 個分析分頁**：

1. **總覽（Summary）**：總訪客數、總反應數、總事件數、完覽率、平均最大瀏覽張數、裝置分佈、熱門作品、反應類型分佈
2. **熱力圖（Slide Heatmap）**：每張作品的瀏覽次數、平均停留時間、洞察開啟次數、反應分佈
3. **粉絲分層（Fan Scores）**：訪客積分排名、分層（路人 / 普通觀眾 / 活躍觀眾 / 忠實粉絲 / 鐵粉）
4. **時間軸（Timeline）**：每日訪問量、反應數、事件數趨勢
5. **開場漏斗（Opening Funnel）**：各階段轉化率（呼吸 → 氣泡 → 消化 → 輪播 → 完成）
6. **裝置分析（Device Analytics）**：裝置類型、螢幕尺寸、OS / 瀏覽器、連線類型、時區分佈
7. **互動分析（Engagement）**：平均互動深度、回訪率、情緒分佈、WhatsApp 轉化率
8. **WhatsApp 潛客（Leads）**：潛客列表、首次接觸時間、來源、對話歷程
9. **轉化漏斗（Conversion Funnel）**：瀏覽作品 → 點擊反應 → 分享請求 → WhatsApp 聯繫 → 點擊下載 → 實際下載

**設置 Modal**：
- 提供後台設置項的讀取 / 修改（透過 `/api/admin/settings`）
- 數據重置按鈕（需 `X-Reset-Token` 驗證）

### 3.3 語錄畫廊（Quote Gallery）

獨立於 React 主應用的 134 條阿占隨意語錄畫廊，以靜態 HTML/JS 實現：

**入口**：
- 完整畫廊：`/gallery/`（密碼保護：4453）
- 單條分享：`/?code={4位代碼}`（公開，無需密碼）

**核心功能**：
- **3D 翻轉卡片**：CSS perspective 1200px，自動 5 秒後翻回
- **10 種畫框風格**：`hashCode(code) % 10` 確保同一語錄永遠使用同一畫框
- **搜索與分類**：關鍵字搜索語錄內容
- **音樂播放**：背景播放 Canon 0.85x 版本
- **反應互動**：5 種反應（👍 like / ❤️ love / 😂 laugh / 😮 wow / 😢 sad），同步到 D1
- **WhatsApp 分享**：一鍵分享語錄到 WhatsApp
- **訂閱功能**：通過 API 生成 WhatsApp deeplink，Salesmartly webhook 處理訂閱確認

**數據結構**：
```typescript
interface Quote {
  code: string;        // 4位唯一代碼，如 "9fz0"
  id: number;          // 顯示編號 1-134
  title: string;       // 語錄標題
  caption: string;     // 語錄全文
  insight: string;     // 固定解畫文字
  image: string;       // 圖片路徑，如 "gallery-images/9fz0.jpeg"
}
```

**圖片優化**：
- 原始 JPEG：`gallery-images/{code}.jpeg`（~14.4MB 總計）
- WebP 版本：`gallery-images-webp/{code}.webp`（~6.4MB 總計，節省 55.7%）
- 前端使用 `<picture>` 標籤自動適配 WebP / JPEG fallback

### 3.4 today_insight 每日解畫

**概念**：每日根據香港新聞情緒，為 134 條語錄各寫一句「今日解畫」（≤40 字），讓舊語錄與今日新聞產生共鳴。

**工作流程**：
```
外部 Agent（每日 5:00 AM 定時運行）
  → 抓取香港新聞（HK01 / 星島 / Yahoo HK）
  → 分析今日社會情緒基調
  → 為 134 條語錄各撰寫 today_insight（≤40 字）
  → POST /api/admin/today-insights（X-Admin-Token）
  → Worker 批量更新 D1 quotes.today_insight
  → POST /api/admin/purge-cache 清除 CDN 緩存
```

**顯示規則**：
- 畫廊 Modal 和單條視圖優先顯示 `today_insight`
- 若今日尚未更新，回退顯示固定 `insight`
- 顯示標籤：有 today_insight 時顯示「今日解畫」，否則顯示「阿占隨意 · 解畫」
- **不保留歷史**，不顯示日期，不允許切換回固定 insight

**Agent 寫作規範**：
- ≤ 40 個中文字（含標點）
- 書面語為主，可帶少許口語化
- 溫柔、有同理心、引發共鳴
- 禁止消費災難、政治立場、粗俗用語
- 將語錄普世智慧與今日新聞情緒連結

---

## 4. 用戶流程

### 4.1 主流程（Happy Path）

```
[首次進入]
    │
    ▼
[Healing Intro] ──► 呼吸引導 → 戳破煩惱氣泡 → 消化金句 → 輪播預告
    │
    ▼
[點擊「我哋出發」]
    │
    ▼
[Opening 動畫] ──► 短暫品牌動畫過渡
    │
    ▼
[Card Gallery] ──► 滑動瀏覽 15 張作品
    │                ├── 點擊情緒反應（❤️😂🍵💡👍）
    │                ├── 點擊「洞察」查看深度解讀
    │                └── 點擊「索取卡片」進入 CollageGenerator
    │
    ▼
[瀏覽至第 15 張或手動進入]
    │
    ▼
[Ending Screen] ──► 統計回顧 + 個性測驗（可選）
    │                ├── 重新瀏覽
    │                ├── WhatsApp 對話
    │                └── 索取卡片
    │
    ▼
[CollageGenerator]
    │
    ▼
[WhatsApp Deeplink] ──► 用戶發送預設訊息至 Salesmartly
    │
    ▼
[Salesmartly Webhook] ──► Worker 回覆下載連結 /dl/{token}
    │
    ▼
[下載頁] ──► 顯示語錄 + 解鎖按鈕 → 點擊生成並下載 PNG
```

### 4.2 WhatsApp 卡片分享閉環

```
用戶點擊「索取卡片」
    │
    ▼
POST /api/public/card-share/request
    ├── 創建 share_token
    ├── 記錄 card_shares（status: pending）
    └── 返回 WhatsApp deeplink（含預填訊息）
    │
    ▼
用戶點擊 deeplink → 開啟 WhatsApp → 發送訊息
    │
    ▼
Salesmartly 收到訊息
    │
    ▼
Webhook → POST Worker /webhook
    ├── 驗證 WEBHOOK_TOKEN
    ├── 查詢 card_shares 記錄
    ├── 創建 / 更新 whatsapp_leads
    └── 回覆卡片下載連結（https://jamestyle.com/dl/{token}）
    │
    ▼
[可選] CloudWapi 主動推送卡片圖片（如配置 API Key）
    │
    ▼
用戶點擊連結進入 /dl/{token}
    │
    ▼
顯示語錄文字 + 作品標題 +「解鎖下載」按鈕（無圖片預覽）
    │
    ▼
用戶點擊「解鎖」
    │
    ▼
Canvas 實時繪製 1080×1080 PNG（含動態日期印章）
    │
    ▼
觸發瀏覽器下載 + 更新 card_shares status → downloaded
```

### 4.3 秘密後台入口

```
用戶在任何頁面
    │
    ▼
1 秒內連按 'a' 鍵 3 次
    │
    ▼
切換 AnalyticsDashboard 顯示 / 隱藏
    │
    ▼
[AnalyticsDashboard] ──► 9 個分頁 + 設置 Modal
```

---

## 5. 數據追蹤需求

### 5.1 數據庫 Schema

#### 5.1.1 reactions（反應記錄）

| 欄位 | 類型 | 說明 |
|-----|------|------|
| id | INTEGER PK AI | 自增主鍵 |
| slide_id | INTEGER NOT NULL | 作品編號 1–15 |
| reaction_type | TEXT NOT NULL | 反應類型（heart / funny / heal / insight / like） |
| session_id | TEXT | 訪客 session ID |
| created_at | INTEGER | Unix 時間戳（預設 `unixepoch()`） |

#### 5.1.2 visitor_sessions（訪客會話）

| 欄位 | 類型 | 說明 |
|-----|------|------|
| id | TEXT PK | UUID 格式 session ID |
| fingerprint | TEXT | 瀏覽器指紋 |
| user_agent | TEXT | User-Agent 字串 |
| referrer | TEXT | 來源網址 |
| device_type | TEXT | mobile / tablet / desktop |
| screen_width | INTEGER | 螢幕寬度 |
| screen_height | INTEGER | 螢幕高度 |
| language | TEXT | 瀏覽器語言 |
| session_start | INTEGER | 會話開始時間 |
| last_active | INTEGER | 最後活躍時間 |
| total_slides_viewed | INTEGER | 總瀏覽張數 |
| max_slide_reached | INTEGER | 到達的最大作品編號 |
| completed_gallery | INTEGER | 是否完覽（0/1） |
| took_quiz | INTEGER | 是否完成測驗（0/1） |
| quiz_result | INTEGER | 測驗結果類型 0–3 |

#### 5.1.3 visitor_events（行為事件）

| 欄位 | 類型 | 說明 |
|-----|------|------|
| id | INTEGER PK AI | 自增主鍵 |
| session_id | TEXT NOT NULL | 關聯 session |
| event_type | TEXT NOT NULL | 事件類型（見下方） |
| slide_id | INTEGER | 關聯作品編號（可選） |
| event_data | TEXT | JSON 格式附加數據 |
| duration_ms | INTEGER | 事件持續時間（毫秒） |
| created_at | INTEGER | Unix 時間戳 |

**事件類型清單**：

| event_type | 說明 |
|-----------|------|
| `slide_view` | 瀏覽作品 |
| `slide_swipe` | 滑動切換作品 |
| `insight_open` | 開啟洞察語句 |
| `insight_close` | 關閉洞察語句 |
| `insight_read` | 閱讀洞察（記錄時長） |
| `reaction_click` | 點擊反應按鈕 |
| `emotion_vote` | 情緒投票 |
| `favorite_toggle` | 收藏切換（已遺留但功能移除） |
| `card_share_request` | 請求卡片分享 |
| `card_share_open` | 開啟分享面板 |
| `card_share_click` | 點擊分享按鈕 |
| `share_download` | 下載卡片 |
| `share_whatsapp` | WhatsApp 分享 |
| `share_webshare` | Web Share API 分享 |
| `achievement_unlocked` | 成就解鎖 |
| `bubble_pop` | 戳破氣泡 |
| `quiz_answer` | 測驗作答 |
| `sound_toggle` | 音效開關 |
| `lang_change` | 語言切換 |
| `autoplay_toggle` | 自動播放開關 |

#### 5.1.4 device_metrics（裝置數據）

| 欄位 | 類型 | 說明 |
|-----|------|------|
| id | INTEGER PK AI | 自增主鍵 |
| session_id | TEXT NOT NULL | 關聯 session |
| device_type | TEXT | 裝置類型 |
| screen_width / height | INTEGER | 螢幕尺寸 |
| device_pixel_ratio | INTEGER | DPR |
| orientation | TEXT | portrait / landscape |
| os | TEXT | 作業系統 |
| browser | TEXT | 瀏覽器 |
| fcp_ms | INTEGER | First Contentful Paint |
| connection_type | TEXT | 網路類型 |
| language | TEXT | 語言 |
| timezone | TEXT | 時區 |
| memory_gb | INTEGER | 裝置記憶體（GB） |
| touch_latency_ms | INTEGER | 觸控延遲 |
| max_touch_points | INTEGER | 最大觸控點數 |
| created_at | INTEGER | Unix 時間戳 |

> **注意**：每次頁面加載時均發送裝置數據，**不區分裝置類型**。

#### 5.1.5 card_shares（卡片分享）

| 欄位 | 類型 | 說明 |
|-----|------|------|
| id | INTEGER PK AI | 自增主鍵 |
| session_id | TEXT | 關聯 session |
| slide_id | INTEGER NOT NULL | 作品編號 |
| share_token | TEXT NOT NULL UNIQUE | 唯一分享令牌 |
| status | TEXT | pending / completed / downloaded |
| shared_at | INTEGER | 分享時間 |
| phone | TEXT | 用戶電話（從 WhatsApp 獲取） |
| downloaded_at | INTEGER | 下載時間 |
| created_at | INTEGER | 創建時間 |

#### 5.1.6 whatsapp_leads（WhatsApp 潛客）

| 欄位 | 類型 | 說明 |
|-----|------|------|
| id | INTEGER PK AI | 自增主鍵 |
| phone | TEXT NOT NULL UNIQUE | 電話號碼 |
| session_id | TEXT | 首次關聯 session |
| share_token | TEXT | 關聯 share token |
| first_slide_id | INTEGER | 首次索取的作品 |
| card_url | TEXT | 卡片下載網址 |
| source | TEXT | 來源（預設 `card_share`） |
| first_contact_at | INTEGER | 首次接觸時間 |
| share_count | INTEGER | 分享次數 |
| last_share_at | INTEGER | 最後分享時間 |
| conversation_history | TEXT | 對話歷程 JSON |

#### 5.1.7 settings（後台設置）

| 欄位 | 類型 | 說明 |
|-----|------|------|
| id | INTEGER PK AI | 自增主鍵 |
| key | TEXT NOT NULL UNIQUE | 設置鍵 |
| value | TEXT | 設置值 |
| updated_at | INTEGER | 更新時間 |

### 5.2 API 端點

#### 公開端點（Public）

| 方法 | 端點 | 說明 |
|-----|------|------|
| GET | `/api/public/reactions` | 獲取所有反應統計 |
| POST | `/api/public/reactions` | 提交單條反應 |
| POST | `/api/public/sessions` | 初始化 / 更新會話 |
| PATCH | `/api/public/sessions/:id` | 更新會話統計數據 |
| POST | `/api/public/events` | 提交單條事件 |
| POST | `/api/public/events/batch` | 批量提交事件 |
| POST | `/api/public/device-metrics` | 提交裝置數據 |
| POST | `/api/public/card-share/request` | 請求卡片分享 |
| GET | `/api/public/analytics/summary` | 分析總覽 |
| GET | `/api/public/analytics/slide-heatmap` | 作品熱力圖 |
| GET | `/api/public/analytics/fan-scores` | 粉絲分層 |
| GET | `/api/public/analytics/timeline` | 時間軸數據 |
| GET | `/api/public/analytics/opening-funnel` | 開場漏斗 |
| GET | `/api/public/analytics/device-analytics` | 裝置分析 |
| GET | `/api/public/analytics/engagement` | 互動分析 |
| GET | `/api/public/analytics/whatsapp-leads` | WhatsApp 潛客 |
| GET | `/api/public/analytics/conversion-funnel` | 轉化漏斗 |
| GET | `/api/public/analytics/card-downloads` | 卡片下載統計 |
| GET | `/api/public/analytics/customer-journey/:phone` | 單一潛客旅程 |
| GET | `/api/public/settings/:key` | 讀取設置項 |

#### 管理端點（Admin）

| 方法 | 端點 | 說明 |
|-----|------|------|
| POST | `/api/admin/settings` | 更新設置（需 `X-Reset-Token`） |
| POST | `/api/admin/reset` | 重置所有分析數據（需 `X-Reset-Token`） |

### 5.3 會話追蹤機制

1. **Session ID**：首次訪問時於前端生成 UUID，儲存於 `localStorage`，終身有效
2. **Fingerprint**：基於 User-Agent、語言、螢幕尺寸、時區等特徵生成簡易雜湊
3. **初始化**：頁面加載時呼叫 `initSession()`，將 session 數據寫入後端
4. **心跳**：每次事件上報時同步更新 `last_active`
5. **裝置數據**：`initTracking()` 收集裝置資訊並發送至 `POST /api/public/device-metrics`

### 5.4 事件批處理

為降低 API 請求量，事件採用混合策略：
- **即時上報**：反應點擊、成就解鎖、氣泡戳破等關鍵事件使用 `trackEventImmediate()`
- **批次上報**：滑動瀏覽、頁面停留等大量事件累積後使用 `trackEvent()` 批量發送

---

## 6. 非功能需求

### 6.1 性能需求

| 指標 | 目標值 | 測量方式 |
|-----|--------|---------|
| First Contentful Paint（FCP） | < 1.5s | Web Vitals |
| Largest Contentful Paint（LCP） | < 2.5s | Web Vitals |
| 首次互動延遲（TTI） | < 3.0s | Lighthouse |
| 畫廊卡片切換 | < 100ms | 幀率監測 |
| Canvas PNG 生成 | < 2s | 用戶計時 |
| API 響應時間（P95） | < 300ms | Worker 日誌 |

### 6.2 兼容性需求

| 平台 | 支持版本 |
|-----|---------|
| iOS Safari | iOS 14+ |
| Chrome Android | Android 10+ |
| Chrome Desktop | 最新 2 個大版本 |
| Safari macOS | 最新 2 個大版本 |
| WeChat 內置瀏覽器 | 基礎功能兼容 |

**注意事項**：
- WhatsApp deeplink 在 iOS / Android 表現不同，需分別測試
- Web Share API 僅在部分環境可用，需有 fallback

### 6.3 安全需求

| 項目 | 措施 |
|-----|------|
| CORS | 嚴格限制 `origin` 為明確域名列表，**禁止使用 `*`**；設置 `credentials: true` |
| Admin Token | 數據重置與設置修改需驗證 `X-Reset-Token` header |
| Webhook 驗證 | Salesmartly webhook 需驗證 `WEBHOOK_TOKEN` |
| SQL 注入 | 使用 Drizzle ORM 參數化查詢 |
| XSS | React 原生轉義 + 謹慎使用 `dangerouslySetInnerHTML` |

### 6.4 可靠性需求

| 項目 | 措施 |
|-----|------|
| 離線體驗 | 畫廊圖片需預載，但無網路時基本瀏覽仍可用（圖片緩存） |
| API 降級 | 後端請求失敗時，前端優雅降級（顯示種子數據而非空白） |
| 數據持久化 | 用戶偏好（語言、音效、成就）存於 `localStorage` |
| CDN 緩存 | Cloudflare Pages 自動緩存靜態資源；部署後用戶需硬刷新（`Ctrl+Shift+R`）以獲最新版本 |

### 6.5 可訪問性需求

- 支持鍵盤導航（左右方向鍵切換作品）
- 圖片包含 `alt` 文字
- 按鈕具備明確的 focus 狀態
- 色彩對比度符合 WCAG AA 標準

### 6.6 設計規範

| 元素 | 規格 |
|-----|------|
| 主背景色 | `#F5F2ED`（暖白） |
| 深色背景 | `#1a1a1a` |
| 主色調 | `#C4956A`（暖金） |
| 字體 | 內海字體（naikai） |
| 裝飾線 | 1px 漸層或實線，透明度 0.25–0.4 |
| 動畫曲線 | `[0.22, 1, 0.36, 1]`（ease-out-expo）|
| 彈簧物理 | `stiffness: 150–300`, `damping: 18–28` |

---

## 7. 未來擴展

### 7.1 近期擴展（1–3 個月）

| 功能 | 說明 | 優先級 |
|-----|------|--------|
| 新作品上架 | 新增第 16–20 張作品，延續 4 個 Act 主題 | 高 |
| 社交分享優化 | 支持直接下載 PNG（不依賴 WhatsApp）作為 fallback | 高 |
| 多語言擴展 | 增加英文版本，拓展海外受眾 | 中 |
| 開場動畫 A/B 測試 | 測試不同開場時長對完覽率的影響 | 中 |

### 7.2 中期擴展（3–6 個月）

| 功能 | 說明 | 優先級 |
|-----|------|--------|
| 用戶帳號系統 | 支援手機號 / Email 註冊，跨裝置同步收藏與成就 | 中 |
| 留言牆 | 每張作品下方開放用戶留言，需後台審核 | 中 |
| 排行榜 | 每週熱門作品、熱門反應統計 | 低 |
| 推送通知 | PWA + Web Push，新作品上架通知 | 低 |

### 7.3 長期願景（6–12 個月）

| 功能 | 說明 | 優先級 |
|-----|------|--------|
| AI 個性化推薦 | 基於用戶情緒投票歷史，推薦最契合的作品 | 低 |
| 實體周邊商城 | 將熱門作品印製成明信片、海報，線上購買 | 低 |
| 創作者平台 | 開放其他藝術家投稿作品，形成語錄創作社群 | 低 |
| NFT 數位收藏 | 將經典作品鑄造成 NFT，提供數位所有權證明 | 低 |

### 7.4 技術債務與優化

| 項目 | 說明 | 優先級 |
|-----|------|--------|
| 圖片格式升級 | 將 JPEG 轉為 AVIF / WebP，減少 30–50% 體積 | 高 |
| 代碼分割 | 按 phase 懶加載組件，減少首屏 bundle | 中 |
| Service Worker | 實現 PWA 離線緩存與背景同步 | 中 |
| 數據遷移工具 | 建立自動化 D1 migration 流程 | 低 |

---

## 附錄

### A. 環境變量清單

| 變量名 | 位置 | 說明 |
|--------|------|------|
| `CLOUDFLARE_API_TOKEN` | 本地環境 | Wrangler CLI 部署憑證 |
| `RESET_TOKEN` | Worker Secret | 管理後台重置接口驗證 |
| `ADMIN_WHATSAPP` | Worker Secret | WhatsApp 客服號碼（85262322466） |
| `CLOUDWAPI_KEY` | Worker Secret | CloudWapi WhatsApp API Key |
| `CLOUDWAPI_SENDER` | Worker Secret | CloudWapi 發送方號碼 |
| `WEBHOOK_TOKEN` | Worker Secret | Salesmartly Webhook 驗證 |
| `DB` | wrangler.toml | D1 數據庫綁定 |
| `CARD_IMAGES` | wrangler.toml | R2 卡片圖片存儲桶 |

### B. 常用部署指令

```powershell
# 前端構建
cd .build_src && pnpm run build

# 鏡像同步至部署目錄
robocopy .build_src\dist .deploy_tmp /MIR

# 部署前端（Cloudflare Pages）
cd backend
$env:CLOUDFLARE_API_TOKEN = (Get-Content C:\Users\Owner\.wrangler\config.json | ConvertFrom-Json).api_token
pnpm exec wrangler pages deploy ..\.deploy_tmp --project-name=jamestyle --branch=main

# 部署後端（Cloudflare Worker）
pnpm exec wrangler deploy --config=wrangler.toml
```

### C. 數據重置指令

```powershell
Invoke-RestMethod -Uri 'https://jamestyle-analytics.jimsbond007.workers.dev/api/admin/reset' `
  -Method POST -Headers @{ "X-Reset-Token" = "jamesstyle-reset-2025" }
```

---

*本文件為 JameStyle 項目的產品需求文件（PRD），由開發團隊維護，與 `AGENTS.md` 互為補充。如有功能變更，需同步更新本文件。*
