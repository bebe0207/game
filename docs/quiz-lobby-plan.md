# quiz-lobby.html 計劃

## 總覽

將 `quiz-host.html` 和 `quiz-player.html` 合併成單一頁面 `quiz-lobby.html`。
打開頁面時顯示「角色選擇畫面」，讓使用者點選「我是主持人」或「我是玩家」，
之後各自進入對應流程。完成後更新 `index.html` 的連結。

**不修改 `server.js`**（WebSocket 協議不變）。
**保留** `quiz.html`（單人版）不動。
**廢棄** `quiz-host.html` 和 `quiz-player.html`（可保留檔案但 index.html 改連到新頁面）。

---

## Sub-Task 1：建立 quiz-lobby.html 骨架與角色選擇畫面

**Intent**
建立新檔案，包含所有 screen 的 HTML 骨架與 CSS，以及最初的「角色選擇」畫面。

**Expected Outcomes**
- 打開 `quiz-lobby.html` 可以看到「我是主持人 / 我是玩家」的選擇畫面
- 畫面風格與現有頁面一致（`--bg: #0e0b1e`，紫色 accent）
- 所有 screen 的 HTML 元素都已存在（用 `display:none` 隱藏）

**Todo List**
1. 建立 `quiz-lobby.html`，`<head>` 包含所有 CSS（role、host-setup、host-lobby、question-host、question-player、reveal-host、reveal-player、ended-host、ended-player 等畫面）
2. `<body>` 加入 topbar（標題「🎯 爆爆問答」，左邊返回 index.html）
3. 加入所有 screen div（`role`、`host-setup`、`host-lobby`、`host-question`、`host-reveal`、`host-ended`、`player-join`、`player-waiting`、`player-question`、`player-reveal`、`player-ended`），預設只有 `role` screen 是 active
4. `role` 畫面：兩張大卡片 — 「🎙️ 我是主持人」和「🎮 我是玩家」，點擊後切換到對應的第一個 screen

**Relevant Context**
- `quiz-host.html` CSS 和 HTML 結構
- `quiz-player.html` CSS 和 HTML 結構
- 現有的 `.screen` / `.screen.active` 切換模式

**Status** — `[ ] pending`

---

## Sub-Task 2：主持人流程（Setup → Lobby → Question → Reveal → Ended）

**Intent**
搬移並整合 `quiz-host.html` 的完整主持人邏輯到 `quiz-lobby.html`，
包含：選題庫、自訂題庫編輯器（從 `quiz.html` 移植）、建立房間、遊戲控制。

**Expected Outcomes**
- 主持人可以選內建題庫或點「✏️ 自訂題庫」開啟編輯器新增題目
- 按「建立房間」後顯示 Lobby 畫面與 6 位數房間碼
- 遊戲流程（發題、倒數、揭曉、下一題、結束）完整運作

**Todo List**
1. 將 `BUILTIN_PACKS` 資料複製進來
2. 搬移 `quiz-host.html` 的 Setup 畫面 HTML（packGrid、題數、時間設定、建立按鈕）
3. 在 Setup 畫面加入「✏️ 自訂題庫」按鈕，開啟 editor screen（從 `quiz.html` 移植 addQCard / renderEditor / saveCustomPack 邏輯）
4. 搬移 `quiz-host.html` 的 Lobby、Question、Reveal、Ended 畫面 HTML
5. 搬移 `quiz-host.html` 的完整 JS 邏輯（connectWS、handleHostMsg、showQuestionScreen、showRevealScreen、showEndedScreen、renderLb）
6. 加入自訂題庫編輯器的 JS（loadCustomPack、saveCustomPack、renderEditor、addQCard）

**Relevant Context**
- `quiz-host.html` 全部 JS（`handleQuizMsg` → `handle`）
- `quiz.html` 的自訂題庫編輯器（`openEditor`、`addQCard`、`btnSaveCustom` 邏輯，lines 515-569）
- `server.js` 的 `quiz_create` / `quiz_start` / `quiz_next` 訊息格式

**Status** — `[ ] pending`

---

## Sub-Task 3：玩家流程（Join → Waiting → Question → Reveal → Ended）

**Intent**
搬移並整合 `quiz-player.html` 的完整玩家邏輯到 `quiz-lobby.html`。

**Expected Outcomes**
- 玩家輸入房間碼和暱稱後按加入，成功後顯示等待畫面
- 收到題目後顯示選項，按鈕可點選答題
- Reveal 畫面先高亮正確選項（0.8s），再跳到分數排行畫面
- 答對時顯示綠色分數、答錯顯示正確答案
- 最終排行榜正確顯示名次

**Todo List**
1. 搬移 `quiz-player.html` 的 Join、Waiting、Question、Reveal、Ended 畫面 HTML
2. 搬移 `quiz-player.html` 的完整 JS（tryJoin、handlePlayerMsg、showQuestionScreen、startTimer、showRevealScreen、showEndedScreen、spawnScorePop）
3. 注意 `ws`、`myName`、`myRoomId` 等變數不能與主持人的 ws 衝突（用不同變數名稱或用 role flag 區分）

**Relevant Context**
- `quiz-player.html` 已修復的版本（含 `chosen` class、`{}` 包住 case、`setTimeout` 延遲切換）
- 玩家的 ws 連線在 `tryJoin()` 時建立，與主持人的 `connectWS()` 分開

**Status** — `[ ] pending`

---

## Sub-Task 4：更新 index.html 連結

**Intent**
將 `index.html` 中原本指向 `quiz-host.html` 的卡片改成指向 `quiz-lobby.html`，
並更新卡片說明文字。

**Expected Outcomes**
- 首頁點「問答聯線主持」卡片會前往 `quiz-lobby.html`
- 卡片說明更新為「主持人出題或玩家加入，多人同時搶答！」

**Todo List**
1. 將 `index.html` 中 `href="quiz-host.html"` 改為 `href="quiz-lobby.html"`
2. 更新卡片 `<p>` 說明文字

**Relevant Context**
- `index.html` line 176-181（問答聯線主持卡片）

**Status** — `[ ] pending`

---

## Sub-Task 5：git commit & push

**Intent**
將所有變更推送到 GitHub，讓 GitHub Pages 更新。

**Todo List**
1. `git add quiz-lobby.html index.html`
2. `git commit -m "feat(quiz): 合併主持人與玩家介面為 quiz-lobby.html，主持人可建立自訂題庫"`
3. `git push origin main`

**Status** — `[ ] pending`
