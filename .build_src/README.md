# JameStyle Frontend

React + Vite + Tailwind CSS 構建的沉浸式互動畫廊網站。

## 技術棧

- **框架**: React 18 + TypeScript
- **構建**: Vite 7
- **樣式**: Tailwind CSS 3 + 自定義設計系統
- **動畫**: Framer Motion + GSAP
- **狀態**: Zustand
- **API**: EdgeSpark client (`@edgespark/client`)
- **字體**: NaikaiFont (內建楷書風格中文字體)

## 組件結構

```
src/
├── App.tsx                    # 主應用流程控制器
├── api/
│   └── reactionsApi.ts        # API 客戶端 + session/tracking 工具
├── store/
│   └── appStore.ts            # Zustand 全局狀態
├── components/
│   ├── HealingIntro.tsx       # 治癒開場動畫（5 階段，30s）
│   ├── Opening.tsx            # 開場過渡動畫
│   ├── CardGallery.tsx        # 15 張作品卡片畫廊
│   ├── EndingScreen.tsx       # 結尾感謝頁
│   ├── QuizModal.tsx          # 性格測試彈窗
│   ├── ShareModal.tsx         # 分享彈窗
│   ├── LangToggle.tsx         # 繁簡語言切換
│   ├── AnalyticsDashboard.tsx # 數據分析後台（隱藏）
│   └── slides.ts              # 15 張作品數據
```

## 應用流程 (Phase)

```
healing → opening → gallery → ending
```

1. **healing**: HealingIntro 播放（呼吸 → 氣泡 → 消化 → 輪播預告 → 完成）
2. **opening**: 簡短過渡動畫
3. **gallery**: 主畫廊，用戶瀏覽 15 張作品
4. **ending**: 結尾頁 + 性格測試入口

## 數據收集

`appStore.ts` 的 `initTracking()` 在頁面加載時：
1. 調用 `initSession()` 創建/恢復訪客 session
2. 調用 `submitDeviceMetrics()` 上報裝置信息
3. 設置事件隊列，定期批量上報行為事件

## Analytics Dashboard

**快速連按 `a` 鍵 3 次**（1 秒內）觸發，顯示 6 個 Tab：

- 📊 總覽
- 🌅 Opening 漏斗
- 🔥 作品熱力
- ❤️ 粉絲指數
- 📈 趨勢
- 📱 裝置數據

## 開發

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

## 構建

```bash
pnpm run build    # 輸出到 dist/
```

## 設計系統

Tailwind 自定義顏色（見 `tailwind.config.js`）：

| Token | 色值 | 用途 |
|-------|------|------|
| `cream` | `#FAF8F3` | 奶白色主文字 |
| `warm-gold` | `#C4956A` | 強調色、標題 |
| `james-orange` | `#E8621A` | 品牌橙色 |
| `james-dark` | `#0D0B09` | 背景色 |
| `james-card` | `#141210` | 卡片背景 |

## 幻燈片數據格式

```typescript
interface Slide {
  id: number;
  emoji: string;
  image: string;        // /images/01.jpeg
  caption: { tc: string; sc: string };
  insight: { tc: string; sc: string };
}
```

15 張作品數據定義在 `src/components/slides.ts`。
