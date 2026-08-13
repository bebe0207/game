# 地下城文字 RPG 計劃

## 總覽

建立 `dungeon.html`：純前端單頁文字 RPG，深色主題，風格與合輯一致。
- **共 20 層**地下城，每 5 層一個 Boss（B5、B10、B15、B20）
- **3 種職業**：戰士、法師、盜賊，各有獨特屬性與技能
- **回合制戰鬥**：玩家選擇行動 → 敵人反擊
- **隨機事件**：怪物 / 商店 / 寶箱 / 陷阱
- 純 HTML 單檔，無框架，無伺服器

---

## 資料設計

### 職業初始屬性

| 職業 | HP | ATK | DEF | SPD | 技能 |
|------|-----|-----|-----|-----|------|
| ⚔️ 戰士 | 120 | 15 | 8 | 5 | 重擊（2x傷害，CD3）、防禦姿態（+10DEF一回合）|
| 🔮 法師 | 80 | 25 | 3 | 7 | 火球（1.8x+灼燒2回合）、魔法護盾（吸收傷害）|
| 🗡️ 盜賊 | 95 | 18 | 5 | 12 | 背刺（先手2x傷害）、煙霧彈（必定逃跑）|

### 屬性說明
- **HP**：生命值，歸零死亡
- **ATK**：攻擊力，影響普攻傷害
- **DEF**：防禦力，減少受到傷害
- **SPD**：速度，決定先攻（SPD更高先攻）
- **GOLD**：金幣，商店購物用
- **EXP/LV**：每升一級 +5HP +2ATK +1DEF

### 裝備種類（在商店/寶箱取得）
- 武器：提升 ATK
- 護甲：提升 DEF
- 頸鍊：提升 HP 上限
- 藥水：即時回復 HP（消耗品，可攜帶 3 個）

---

## Sub-Task 1：HTML 骨架、CSS、畫面結構

**Intent**
建立 `dungeon.html`，包含所有畫面的 HTML 結構和完整 CSS。

**Expected Outcomes**
- 所有畫面 div 存在（title、class-select、explore、battle、shop、chest、trap、result）
- 深色主題（`--bg:#0d0d1a`），風格與合輯一致
- 右側有角色狀態面板（HP 進度條、ATK/DEF/SPD、裝備槽、藥水數量、金幣、樓層）
- 左側為主要內容區（日誌文字框、事件畫面、戰鬥按鈕）

**Todo List**
1. 建立 `dungeon.html`，`<head>` 完整 CSS（佈局、面板、按鈕、日誌、動畫）
2. title screen：遊戲標題、「開始冒險」按鈕
3. class-select screen：三個職業卡片可點選
4. main screen（含 sub-states 用 JS 控制）：
   - 左欄：事件描述區 `#event-box`、行動按鈕組 `#action-btns`、日誌捲動區 `#log`
   - 右欄：角色狀態面板 `#status-panel`（HP 條、各屬性、裝備、藥水、金幣、樓層）
5. result screen：通關 / 死亡 結果頁

**Relevant Context**
- 現有頁面使用 `--bg: #0d0d1a`、`#1a1a2e` panel、深色 border
- 所有按鈕使用漸層紫色或紅/綠色調

**Status** — `[ ] pending`

---

## Sub-Task 2：職業選擇 + 角色系統

**Intent**
建立角色資料結構、三種職業定義、升級系統。

**Expected Outcomes**
- 點選職業後初始化角色物件（hp, maxHp, atk, def, spd, gold, exp, lv, skills, equipment, potions）
- 狀態面板即時反映角色狀態（HP 條顏色隨比例變化）
- 升級時正確加點並顯示升級日誌

**Todo List**
1. 定義 `CLASSES` 物件（三職業屬性 + 技能定義）
2. `createPlayer(classId)` 函式初始化角色
3. `updateStatusPanel()` 函式更新右側面板（HP 條、各數值、裝備、藥水）
4. `gainExp(amount)` 函式：加 EXP，滿了就升級並呼叫 `updateStatusPanel`
5. 職業卡片點擊 → 呼叫 `createPlayer` → 進入探索第 1 層

**Relevant Context**
- 資料設計章節的職業表

**Status** — `[ ] pending`

---

## Sub-Task 3：地下城探索 + 隨機事件

**Intent**
實作逐層探索邏輯：每層生成隨機事件，玩家按「探索」觸發。

**Expected Outcomes**
- 每層按下「繼續探索」後隨機抽取事件（加權：怪物50%、商店15%、寶箱20%、陷阱15%）
- 第 5/10/15/20 層強制觸發 Boss
- 日誌區滾動顯示每次事件描述
- 陷阱：損失 HP 10~25% 或失去金幣，加入日誌

**Todo List**
1. 定義 `FLOOR_EVENTS` 加權表
2. `nextFloor()` 函式：樓層+1，判斷是否 Boss，否則抽事件
3. `triggerMonster(isBoss)` 進入戰鬥畫面（切換 action-btns 為戰鬥按鈕）
4. `triggerShop()` 顯示商店選項
5. `triggerChest()` 隨機給予裝備或金幣
6. `triggerTrap()` 扣 HP 或金幣，加日誌，繼續按鈕
7. `addLog(text, type)` 加入日誌（型別：info / good / bad / boss）

**Relevant Context**
- 每層敵人強度隨層數提升（hp = 20 + floor*8, atk = 5 + floor*2）

**Status** — `[ ] pending`

---

## Sub-Task 4：回合制戰鬥系統

**Intent**
實作完整的回合制戰鬥：玩家行動 → 傷害計算 → 敵人反擊 → 狀態效果 → 戰鬥結束。

**Expected Outcomes**
- 攻擊：普攻 / 技能（各職業 2 技能，有 CD）/ 使用藥水 / 逃跑
- 傷害公式：`dmg = max(1, atk - def + random(-2,+2))`
- 先攻：SPD 高者先攻，同 SPD 隨機
- 技能冷卻（CD）倒數，未冷卻的技能按鈕顯示灰色
- 灼燒/中毒等狀態持續傷害（每回合結算）
- 敵人死亡 → 獲得金幣 + EXP → 回到探索
- 玩家死亡 → 進入 result screen（死亡結局）

**Todo List**
1. 定義 `ENEMIES` 資料（一般怪物 + Boss 各層）
2. `startBattle(enemy)` 初始化戰鬥狀態（回合、狀態效果 Map、CD 計數器）
3. `playerAction(type, skillId?)` 處理玩家行動，計算傷害，更新戰鬥日誌
4. `enemyTurn()` 敵人 AI（50% 普攻、30% 強攻×1.5、20% 嘲諷）
5. `resolveStatusEffects()` 每回合結算灼燒/中毒
6. `checkBattleEnd()` 判斷勝負，呼叫後續邏輯
7. 技能按鈕動態生成，CD 顯示在按鈕上

**Relevant Context**
- Sub-Task 2 的技能定義
- Sub-Task 3 的 `triggerMonster(isBoss)`

**Status** — `[ ] pending`

---

## Sub-Task 5：商店系統 + 裝備系統

**Intent**
實作商店購物（花金幣買裝備/藥水）和裝備管理。

**Expected Outcomes**
- 商店隨機提供 3 件商品（從裝備池 + 藥水中抽取）
- 金幣不足的商品按鈕顯示禁用
- 裝備有插槽限制（武器/護甲/頸鍊各一件），購買同類會替換並提示
- 寶箱：隨機給一件裝備或 10~50 金幣

**Todo List**
1. 定義 `ITEMS` 裝備資料（name, slot, atk/def/hp bonus, price, rarity）
2. `openShop()` 從 ITEMS 抽 3 件 + 藥水，渲染商店 UI
3. `buyItem(itemId)` 扣金幣、裝備上身（替換舊裝備）、更新面板
4. `openChest()` 抽獎邏輯，加入日誌
5. `equipItem(item)` / `unequipItem(slot)` 管理裝備槽與屬性加成

**Relevant Context**
- Sub-Task 2 的 `updateStatusPanel()`
- 商品價格範圍：武器 30~80G、護甲 25~70G、頸鍊 40~90G、藥水 15G

**Status** — `[ ] pending`

---

## Sub-Task 6：結局畫面 + index.html 更新

**Intent**
實作通關與死亡結局，並更新 index.html 加入新遊戲卡片。

**Expected Outcomes**
- 死亡：顯示死亡原因、最終樓層、職業、時間
- 通關（第 20 層 Boss 擊敗）：慶祝動畫、通關統計（職業/樓層/金幣/擊殺數）
- 「重新開始」按鈕回到職業選擇
- index.html 新增地下城遊戲卡片（橙紅 accent）

**Todo List**
1. `gameOver(reason)` 函式：切換到 result screen，顯示統計
2. `gameClear()` 函式：通關版本，顯示 🏆 動畫
3. 「重新開始」重設所有狀態，回到 class-select
4. 更新 `index.html` 加入卡片

**Status** — `[ ] pending`

---

## Sub-Task 7：git commit & push

**Todo List**
1. `git add dungeon.html index.html`
2. `git commit -m "feat: 新增地下城文字 RPG"`
3. `git push origin main`

**Status** — `[ ] pending`
