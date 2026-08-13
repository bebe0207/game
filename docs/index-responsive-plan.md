# index.html 響應式改版 + Bootstrap Icons 計畫

## 目標

將 `index.html` 首頁改為完整響應式版面，並以 Bootstrap Icons（CDN Web Font）取代所有 emoji 圖示。

## 範圍

- 僅修改 `index.html`
- 不動任何遊戲 HTML 或後端邏輯

---

## Sub-Task 1：引入 Bootstrap Icons CDN

**Intent**
透過 CDN `<link>` 在 `<head>` 載入 Bootstrap Icons Web Font，讓後續 `<i class="bi bi-xxx">` 可直接顯示圖示。

**Expected Outcomes**
- `<head>` 內含 Bootstrap Icons CDN link tag

**Todo List**
- [ ] 在 `<head>` 的 `<meta viewport>` 後加入 Bootstrap Icons CDN link

**Relevant Context**
- CDN URL: `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css`

**Status:** [ ] pending

---

## Sub-Task 2：響應式 CSS Grid 斷點

**Intent**
將 `.grid` 從 `auto-fill minmax(210px,1fr)` 改為明確三段斷點，確保桌機 4 欄、平板 2 欄、手機 1 欄。

**Expected Outcomes**
- 桌機（≥992px）：4 欄
- 平板（576–991px）：2 欄
- 手機（<576px）：1 欄
- header h1 在手機也有合適字型大小

**Todo List**
- [ ] 移除 `.grid` 的 `grid-template-columns: repeat(auto-fill, minmax(210px, 1fr))`
- [ ] 改為 `grid-template-columns: repeat(4, 1fr)` 作為預設（桌機）
- [ ] 加入 `@media (max-width: 991px)` → `repeat(2, 1fr)`
- [ ] 加入 `@media (max-width: 575px)` → `repeat(1, 1fr)`
- [ ] 更新 header h1 在手機的字型大小斷點（原 500px → 575px）

**Relevant Context**
- 現有 `@media (max-width: 500px)` 僅調整 h1，一併更新

**Status:** [ ] pending

---

## Sub-Task 3：圖示 — 替換 emoji 為 Bootstrap Icons

**Intent**
將所有 `.card-icon` 內的 emoji 文字改為 `<i class="bi bi-xxx">` 標籤，並調整 CSS 讓圖示在圓角方塊內置中顯示。同時移除 header 的 🎮 emoji，改用 `<i>` 行內圖示。

**Expected Outcomes**
- 9 張遊戲卡的圖示全部顯示為 Bootstrap Icons 向量圖示
- header 標題旁有 bi-joystick 圖示
- 圖示大小、顏色（白色）維持與原設計一致

**Todo List**
- [ ] 調整 `.card-icon` CSS：移除 `font-size: 34px`，改以 `font-size: 32px` 套在 `<i>` 上，顏色設為 `#fff`
- [ ] 俄羅斯方塊：`bi-grid-3x3-gap-fill`
- [ ] 貪吃蛇：`bi-cursor-fill`
- [ ] 打磚塊：`bi-layers-fill`
- [ ] 塔羅占卜：`bi-stars`
- [ ] 俄羅斯方塊對戰：`bi-people-fill`
- [ ] 貪吃蛇對戰：`bi-controller`
- [ ] 問答遊戲：`bi-patch-question-fill`
- [ ] 深淵地下城：`bi-shield-fill-exclamation`
- [ ] 問答聯線對戰：`bi-wifi`
- [ ] Header h1：移除 🎮，改為 `<i class="bi bi-joystick"></i> 小遊戲合輯`

**Status:** [ ] pending
