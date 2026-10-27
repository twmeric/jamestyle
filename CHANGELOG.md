# CHANGELOG — JameStyle

## [2026-10-26] — IP showcase 定位改版：WhatsApp 切阿Bot 線（85262322466）＋消費者入口退役＋品牌合作洽詢上線

### Changed
- EndingScreen：「💬 Whatsapp 索取阿占卡片」CTA 刪除（CollageGenerator 入口關閉，檔案保留作復活點）；「聯絡阿占」（wa.me/85268810677 直開）改造為「🤝 品牌合作洽詢」——直達 **wa.me/85262322466**（阿Bot 三門面線），繁/簡預填自帶「阿占隨意（JameStyle）IP 品牌合作／Crossover」關鍵字供人設路由
- backend `admin_phone` 號碼鏈全切 85262322466：code fallback ×2（/api/share、/api/subscribe）＋AnalyticsDashboard 預設值（D1 settings 該值此前已切）
- 部署：Pages `cd83b37c`（--branch=main）＋Worker `jamestyle-analytics` `80450e25`；生產驗證 live bundle＝新 bundle，85262322466／品牌合作在、索取卡／聯絡阿占字串零殘留

### Removed
- 語錄訂閱入口：UI caller 原已不存在（死 endpoint），是次連 backend 號碼一併對齊——消費者「拿卡／訂閱」功能全面退役，JameStyle 定位收窄為 IP 展示場（show）＋品牌 crossover 洽詢

### 配套（AIBot repo，數據級即時生效）
- admin 租戶 KB 12 chunks（3 AIBot＋6 JKD＋**3 JameStyle**：品牌定位／合作洽詢／FAQ）
- 人設 v4→**v5 三門面**（AIBot／JKD／JameStyle 關鍵字路由）；E2E 虛構號碼段實測：JameStyle 洽詢訊息正確路由＋回覆引 KB 內容＋照流程收品牌名
