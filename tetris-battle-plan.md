# 俄羅斯方塊聯線對戰計畫

## 概述

新增 `tetris-battle.html`（對戰版俄羅斯方塊）與擴充 `server.js`（加入 WebSocket 支援）。
兩位玩家透過房間碼（4位數）配對，即時同步彼此棋盤狀態，消行攻擊制：消 2 行以上送垃圾行給對手。

**不修改** 原本的 `tetris.html`（單人版保留不動）。

---

## 技術選型

- **WebSocket**：使用 Node.js 內建的 `http` 升級機制 + `ws` 套件（需 `npm install ws`）
- **同步策略**：每次方塊落地（lock）時，將完整棋盤陣列傳給伺服器廣播，對手端渲染縮小版預覽
- **攻擊訊息**：clearLines 消 2 行以上時，額外發送 `attack` 訊息，對手收到後在下次 lock 前插入垃圾行

---

## 訊息協議

| 訊息類型 | 方向 | 內容 |
|----------|------|------|
| `create_room` | Client → Server | 建立房間 |
| `join_room` | Client → Server | `{ roomId }` |
| `room_joined` | Server → Client | `{ roomId, playerIndex }` |
| `opponent_joined` | Server → Client | 對手已加入，可開始 |
| `board_update` | Client → Server | `{ board, score, lines, level }` |
| `opponent_update` | Server → Client | `{ board, score, lines }` |
| `attack` | Client → Server | `{ lines: n }` 送 n 行垃圾 |
| `incoming_attack` | Server → Client | `{ lines: n }` 收到攻擊 |
| `game_over` | Client → Server | 宣告自己輸了 |
| `opponent_lost` | Server → Client | 對手輸了（你贏） |
| `room_error` | Server → Client | 房間不存在或已滿 |

---

## 子任務

### 子任務 1 — 擴充 server.js，加入 WebSocket 支援
**狀態：** `[ ] pending`

**Intent**
在現有 HTTP 伺服器上掛載 WebSocket 伺服器（`ws` 套件），管理房間配對邏輯。

**Expected Outcomes**
- `npm install ws` 後，`server.js` 同時提供 HTTP 靜態檔案服務與 WebSocket 服務（同 port 3000）
- 支援建立房間（隨機 4 位碼）、加入房間（最多 2 人）
- 房間滿 2 人時廣播 `opponent_joined`
- 轉發 `board_update`、`attack`、`game_over` 給同房間另一位玩家
- 玩家斷線時通知對手

**Todo List**
- [ ] `npm install ws`，更新 server.js 引入 `ws` 模組
- [ ] 建立 `rooms` Map 管理房間（`roomId → { players: [ws, ws] }`）
- [ ] 處理 `create_room`：產生 4 位數房間碼，回傳 `room_joined`
- [ ] 處理 `join_room`：驗證房間存在且未滿，回傳 `room_joined`，廣播 `opponent_joined`
- [ ] 轉發 `board_update` → `opponent_update`、`attack` → `incoming_attack`、`game_over` → `opponent_lost`
- [ ] 處理斷線：清理房間，通知對手

**Relevant Context**
- 檔案：`server.js`
- ws 套件用法：`new WebSocket.Server({ server })`，掛在現有 http server 上

---

### 子任務 2 — 建立 tetris-battle.html 骨架與連線 UI
**狀態：** `[ ] pending`

**Intent**
建立對戰頁面的 HTML/CSS 骨架，包含三欄佈局（自己棋盤 / 中間狀態 / 對手棋盤）以及連線前的房間碼 UI。

**Expected Outcomes**
- 連線前：顯示「建立房間」和「加入房間」按鈕 + 輸入框
- 建立後：顯示房間碼（可複製），等待對手
- 連線後：進入三欄對戰畫面
- 左側：自己的主棋盤（300×600）+ 側邊資訊（分數/等級/消行/保留/下一個）
- 中間：連線狀態、攻擊警示（收到攻擊時閃紅）、雙方行數對比
- 右側：對手棋盤縮小預覽（150×300）+ 對手分數/等級

**Todo List**
- [ ] HTML 三欄 flex 佈局
- [ ] 連線面板（`#lobby`）：建立/加入按鈕、房間碼輸入、等待中提示
- [ ] 對戰面板（`#battle`，預設隱藏）：左欄自己、中欄狀態、右欄對手
- [ ] CSS：深色主題沿用現有遊戲風格，對手棋盤 50% 縮放
- [ ] 攻擊警示動畫：收到攻擊時自己棋盤邊框閃紅

**Relevant Context**
- 風格參考：`tetris.html`、`index.html`（深色 #0d0d1a，面板 #1a1a2e）
- 對手棋盤用 `transform: scale(0.5)` 或單獨小 canvas（150×300）

---

### 子任務 3 — 移植單人核心遊戲邏輯
**狀態：** `[ ] pending`

**Intent**
將 `tetris.html` 的遊戲核心（棋盤、方塊、移動、旋轉、渲染）完整移植到 `tetris-battle.html`，
讓「自己那側」的遊戲完全可玩，暫不接入聯線。

**Expected Outcomes**
- `tetris-battle.html` 獨立可玩單人俄羅斯方塊（與現有 tetris.html 功能相同）
- 所有函式封裝在 `MyGame` 物件/命名空間中（避免和對手渲染邏輯衝突）
- clearLines 回傳消除行數（供後續攻擊邏輯使用）

**Todo List**
- [ ] 複製 SHAPES、SCORE_TABLE、TAROT_CARDS 等常數
- [ ] 複製所有遊戲函式，包裝在 `const MyGame = { ... }` 或直接以前綴命名
- [ ] 確認 `clearLines()` 回傳 `cleared` 數值
- [ ] 自己棋盤的 canvas id 改為 `myBoard`，確保渲染指向正確 canvas
- [ ] 鍵盤事件綁定到自己的遊戲狀態

**Relevant Context**
- 來源：`tetris.html` 的 `<script>` 區段
- 保留：DAS/ARR 連續移動、保留方塊（C鍵）、Ghost piece、旋轉 Wall kick

---

### 子任務 4 — WebSocket 客戶端邏輯
**狀態：** `[ ] pending`

**Intent**
在 `tetris-battle.html` 中建立 WebSocket 連線，實作完整的訊息收發邏輯。

**Expected Outcomes**
- 按「建立房間」→ 連線 WS → 發送 `create_room` → 顯示房間碼
- 按「加入房間」→ 連線 WS → 發送 `join_room` → 收到 `opponent_joined` 後雙方同時開始
- 每次方塊 lock 後：發送 `board_update`（含棋盤陣列、分數、等級）
- 收到 `opponent_update`：更新對手棋盤預覽
- 遊戲結束（自己死）：發送 `game_over`，顯示「你輸了」
- 收到 `opponent_lost`：顯示「你贏了！」
- 對手斷線：顯示提示，停止遊戲

**Todo List**
- [ ] `connectWS()` 建立 `WebSocket('ws://localhost:3000')`
- [ ] 發送訊息統一用 `ws.send(JSON.stringify({ type, ...data }))`
- [ ] 接收訊息用 `ws.onmessage` 解析 type 分派
- [ ] `sendBoardUpdate()` 在每次 `lock()` 後呼叫
- [ ] `renderOpponentBoard(board)` 渲染對手棋盤（縮小版）

**Relevant Context**
- WebSocket 位址：`ws://localhost:3000`（同 port）
- 棋盤陣列格式：`board[row][col]` = null 或顏色字串

---

### 子任務 5 — 攻擊系統（垃圾行）
**狀態：** `[ ] pending`

**Intent**
實作消行攻擊制：消 2 行以上時送垃圾行給對手；收到攻擊後在下次方塊落地前插入垃圾行。

**Expected Outcomes**
- 消 2 行：送 1 行垃圾；消 3 行：送 2 行；消 4 行（Tetris）：送 4 行
- 垃圾行外觀：灰色磚塊，隨機留一個缺口
- 收到攻擊後，棋盤底部插入垃圾行，所有現有方塊上移
- 中間欄顯示「⚠️ 收到 N 行攻擊！」紅色閃爍提示

**Todo List**
- [ ] 定義攻擊表：`ATTACK_TABLE = [0, 0, 1, 2, 4]`（消 1/2/3/4 行對應送出行數）
- [ ] 修改 `clearLines()`：消行後若 `ATTACK_TABLE[cleared] > 0`，發送 `attack` 訊息
- [ ] `insertGarbageLines(n)` 函式：在 board 底部插入 n 行垃圾行，頂部刪除 n 行
- [ ] 收到 `incoming_attack` 時：呼叫 `insertGarbageLines(n)`，觸發攻擊警示動畫

**Relevant Context**
- 垃圾行格式：`Array(COLS).fill('#4a4a4a')` 後隨機將一格設為 null（缺口）
- 攻擊警示：自己棋盤 canvas 邊框 CSS animation `flash-red`

---

### 子任務 6 — 更新首頁目錄
**狀態：** `[ ] pending`

**Intent**
在 `index.html` 加入俄羅斯方塊對戰的遊戲卡片入口。

**Expected Outcomes**
- 首頁新增第五張卡片：🆚 俄羅斯方塊對戰，連結 `tetris-battle.html`
- 格子由 4 欄調整為適當排列（可改 5 欄或 2×3 grid）

**Todo List**
- [ ] 在 `index.html` `.grid` 新增第五張 `.card`（連結 `tetris-battle.html`，強調色紅色）
- [ ] 調整 `.grid` 欄數（`repeat(auto-fill, minmax(210px, 1fr))`，自動適應）

**Relevant Context**
- 檔案：`index.html`
- 現有卡片格式參考第 130~156 行
