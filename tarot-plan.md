# 塔羅牌小遊戲計畫

## 概述

新增一個塔羅牌占卜小遊戲 `tarot.html`，並更新 `index.html` 加入第四張遊戲卡片。

玩家可以：
1. 輸入想問的問題
2. 選擇抽牌數量（1 / 3 / 5 張）
3. 翻開塔羅牌，看到牌名、正/逆位、關鍵字、牌義
4. 取得一段完整的 GPT 提示詞，可複製或直接開啟 ChatGPT

## 設計風格

沿用現有遊戲的深色主題：
- 背景：`#0d0d1a`
- 面板：`#1a1a2e`，邊框 `#2a2a45`
- 強調色：紫色系 `#a855f7`（塔羅風格）
- 字體：`Segoe UI`, system-ui

---

## 視覺 & 動畫設計

純 CSS + Canvas 繪製，無外部圖片依賴：

- **牌背**：深紫漸層 + 幾何紋樣（SVG inline 或 CSS repeating-gradient）
- **牌面**：每張牌獨特漸層色 + 大型 Emoji 符號 + 牌名
- **粒子背景**：飄動的星星/光點（requestAnimationFrame Canvas 或純 CSS animation）
- **翻牌動畫**：CSS 3D `rotateY` flip，含縮放彈跳
- **抽牌動畫**：牌從中心散開飛到各自位置（CSS keyframes）
- **懸停效果**：牌片 hover 時輕微上浮 + 發光邊框
- **提示詞出現**：淡入 + 向上滑動

## 子任務

### 子任務 1 — 建立塔羅牌資料庫
**狀態：** `[ ] pending`

**Intent**
建立完整的 22 張大阿爾克那塔羅牌資料，每張牌包含：牌名（中文）、關鍵字陣列、正位牌義、逆位牌義。

**Expected Outcomes**
- 一個 JS 陣列 `TAROT_CARDS`，共 22 筆資料
- 每筆資料格式：`{ id, name, emoji, keywords: [], upright: '', reversed: '' }`

**Todo List**
- [ ] 定義 22 張大阿爾克那（0-愚者 到 21-世界）
- [ ] 每張牌包含中文名、代表 Emoji、3 個關鍵字、正位牌義一段話、逆位牌義一段話

**Relevant Context**
- 此資料嵌入 `tarot.html` 的 `<script>` 區段

---

### 子任務 2 — 建立遊戲 UI 骨架
**狀態：** `[ ] pending`

**Intent**
建立 `tarot.html` 的 HTML + CSS 結構，分為三個畫面（步驟）：
1. **Step 1 — 問題輸入畫面**：文字輸入框 + 選擇抽牌數（1/3/5）+ 開始抽牌按鈕
2. **Step 2 — 翻牌畫面**：顯示若干張蓋住的牌面，點擊翻開，翻開後顯示牌名/正逆位/關鍵字/牌義
3. **Step 3 — GPT 提示詞畫面**：顯示完整提示詞文字框 + 複製按鈕 + 開啟 ChatGPT 按鈕

**Expected Outcomes**
- 三個 `<section>` 或 `<div>` 步驟區塊，透過 JS 切換顯示
- 返回首頁按鈕（`← 返回目錄` 連結到 `index.html`）
- 牌的翻轉動畫（CSS 3D flip）

**Todo List**
- [ ] HTML 骨架：topbar（返回）+ step1 + step2 + step3
- [ ] CSS：深色主題、牌片樣式（正面/背面）、3D flip 動畫
- [ ] JS：`showStep(n)` 切換步驟顯示

**Relevant Context**
- 風格參考 `index.html`（.card, .panel, button 樣式）
- 翻牌動畫：CSS `transform: rotateY(180deg)` + `transition`

---

### 子任務 3 — 實作抽牌與翻牌邏輯
**狀態：** `[ ] pending`

**Intent**
實作核心遊戲邏輯：隨機抽牌、決定正/逆位、點擊翻牌顯示內容。

**Expected Outcomes**
- 點「開始抽牌」後，從 22 張不重複隨機抽出指定張數
- 每張牌 50% 機率正位 / 50% 逆位
- 顯示所有牌背，點擊後執行翻牌動畫，同時下方顯示該牌詳細資訊
- 所有牌都翻開後，出現「查看 GPT 提示詞」按鈕

**Todo List**
- [ ] `drawCards(n)` — 隨機抽 n 張不重複，各自決定正/逆位
- [ ] `renderCards(cards)` — 在 step2 渲染牌背卡片
- [ ] `flipCard(index)` — 翻開動畫 + 顯示牌的詳細資訊面板
- [ ] 追蹤已翻牌數量，全部翻完後顯示「查看提示詞」按鈕

**Relevant Context**
- 牌資料來自子任務 1 的 `TAROT_CARDS`
- 翻牌詳細資訊在牌片下方展開，或於牌片右側/下方顯示說明區塊

---

### 子任務 4 — 產生 GPT 提示詞
**狀態：** `[ ] pending`

**Intent**
依據玩家的問題、抽牌數量和抽到的牌，組合一段結構化的 GPT 提示詞。

**Expected Outcomes**
- 提示詞包含：使用者的問題、牌陣名稱（單張/三張/五張）、每張牌的位置意義、牌名、正逆位、關鍵字
- 請求 GPT 以塔羅師角色進行解讀
- 顯示於可捲動的 `<textarea>` 中
- **複製按鈕**：點擊複製到剪貼簿，顯示「已複製！」確認回饋
- **開啟 ChatGPT 按鈕**：組合 `https://chat.openai.com/?q=` + encodeURIComponent(提示詞) 並 `window.open`

**Todo List**
- [ ] `buildPrompt(question, cards, layout)` — 產生提示詞字串
- [ ] 定義各牌陣位置名稱（1張：指引；3張：過去/現在/未來；5張：情況/阻礙/建議/潛意識/結果）
- [ ] 渲染 step3：textarea 顯示提示詞
- [ ] 複製按鈕：`navigator.clipboard.writeText()`
- [ ] 開啟 ChatGPT 按鈕：`window.open('https://chatgpt.com/?q=' + encodeURIComponent(prompt))`

---

### 子任務 5 — 更新首頁目錄
**狀態：** `[ ] pending`

**Intent**
在 `index.html` 的遊戲格中新增塔羅牌遊戲卡片。

**Expected Outcomes**
- 首頁格子從 3 欄 3 張增加到 4 張（可改為 2×2 或保持一行 4 欄）
- 塔羅牌卡片顯示：🔮 圖示、「塔羅占卜」標題、簡短說明、`Tarot` badge
- 連結到 `tarot.html`

**Todo List**
- [ ] 在 `index.html` 的 `.grid` 新增第四張 `.card`（連結 `tarot.html`）
- [ ] 調整 `.grid` CSS：`grid-template-columns: repeat(4, 220px)` 或 `repeat(2, 340px)`

**Relevant Context**
- 檔案：`index.html`
- 現有格子樣式：`.card`，強調色變數 `--accent`
