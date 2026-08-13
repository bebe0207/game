# 2026-08-13 — 響應式版面 + 像素風 SVG 圖示

## 目標

將首頁 `index.html` 從固定版面升級為完整響應式設計，並移除所有 emoji 圖示，改為自製像素風 SVG 縮圖，使視覺風格統一且跨裝置體驗良好。

---

## 方案比較

| # | 方案 | 優點 | 缺點 |
|---|------|------|------|
| 1 | Bootstrap Icons（Web Font CDN） | 實作快速、圖示豐富、風格一致 | 需外部 CDN；圖示為通用設計，無遊戲主題感 |
| 2 | 自製像素風 SVG 內嵌 | 完全離線可用、主題感強、檔案輕量、無外部依賴 | 每張需手繪設計，工時較長 |
| 3 | 使用 Game Icons（CDN SVG sprite） | 遊戲主題豐富 | 需額外處理 sprite；部分圖示風格不統一 |

**選擇方案 2（自製像素風 SVG 內嵌）**

> 遊戲主題強烈、無 CDN 依賴、SVG `image-rendering: pixelated` 確保像素感，且每張圖可完整對應各遊戲主題，整體視覺最協調。

---

## 響應式版面方案比較

| # | 方案 | 優點 | 缺點 |
|---|------|------|------|
| 1 | CSS Grid `auto-fill + minmax` | 一行搞定、彈性最高 | 無法精確控制斷點欄數 |
| 2 | CSS Grid 固定欄數 + media query 斷點 | 欄數可精確控制（4→2→1） | 需手寫 media query |
| 3 | Flexbox + `flex-wrap` | 相容性佳 | 對齊控制較複雜 |

**選擇方案 2（CSS Grid 固定欄數 + media query）**

> 需求明確要求「桌機 4 欄、平板 2 欄、手機 1 欄」，固定斷點方案最直觀精確。

---

## 改動檔案清單

| 檔案 | 改動類型 | 說明 |
|------|---------|------|
| `index.html` | 修改 | 響應式 Grid、移除 emoji、加入像素風 SVG、移除 Bootstrap Icons CDN |
| `docs/updates/_template.md` | 新增 | 更新記錄範本 |
| `docs/updates/2026-08-13-responsive-pixel-icons.md` | 新增 | 本次更新記錄（此檔案） |
| `docs/workflow-plan.md` | 新增 | 標準化工作流程 SOP |

---

## 細項說明

### `index.html`

#### 改動 1：移除 Bootstrap Icons CDN，改為純 SVG 方案

- **位置**：`<head>` 第 7 行
- **改前**：`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />`
- **改後**：移除，無外部依賴
- **原因**：改採內嵌 SVG，不需要字型 CDN

#### 改動 2：`.grid` — 響應式欄數

- **位置**：CSS `.grid` 規則
- **改前**：`grid-template-columns: repeat(auto-fill, minmax(210px, 1fr))`
- **改後**：
  ```css
  /* 桌機 */
  grid-template-columns: repeat(4, 1fr);
  /* 平板 @media (max-width: 991px) */
  grid-template-columns: repeat(2, 1fr);
  /* 手機 @media (max-width: 575px) */
  grid-template-columns: 1fr;
  ```
- **原因**：精確控制三個斷點的欄數，符合需求規格

#### 改動 3：`.card-icon` — 移除字型大小，改為 SVG 容器

- **位置**：CSS `.card-icon`
- **改前**：內含 `font-size: 34px`，用於顯示 emoji
- **改後**：移除 `font-size`，加入 `flex-shrink: 0`；子元素改為 `.card-icon svg { width: 48px; height: 48px; image-rendering: pixelated; }`
- **原因**：SVG 需要獨立尺寸規則與像素渲染設定

#### 改動 4：Header 標題移除 emoji

- **位置**：`<header>` → `<h1>`
- **改前**：`<h1><i class="bi bi-joystick"></i> 小遊戲合輯</h1>`（含 Bootstrap Icons）
- **改後**：`<h1>小遊戲合輯</h1>`（純文字）
- **原因**：SVG 方案不使用 Bootstrap Icons，標題回歸純文字

#### 改動 5：9 張卡片圖示全數替換

每張卡片的 `.card-icon` 內容從 `<i class="bi bi-xxx">` 改為內嵌 `<svg viewBox="0 0 8 8">` 像素圖，以 8×8 格為像素單位，每格對應 1 個 `<rect>`。

| 遊戲 | SVG 設計說明 |
|------|------------|
| 俄羅斯方塊 | I、L、S、T 四種方塊散落，底部有地板線 |
| 貪吃蛇 | S 型蛇身蜿蜒 + 右上角蘋果食物 |
| 打磚塊 | 三排磚牆（部分缺口代表被打碎）+ 飛行中的球 + 底部擋板 |
| 塔羅占卜 | 塔羅牌外框輪廓 + 中央十字星型 + 角落光點裝飾 |
| 俄羅斯方塊對戰 | 左右各有方塊積堆 + 中間 X 形 VS 符號 |
| 貪吃蛇對戰 | 兩條蛇從左上與右下對衝，中間有碰撞火花 |
| 問答遊戲 | 像素問號「？」（弧頂 + 豎幹 + 底點） |
| 深淵地下城 | 左下斜劍（含護手）+ 右下盾牌輪廓 |
| 問答聯線對戰 | 三層同心 WiFi 弧線（由外至內漸亮）+ 底部訊號點 |

**像素透明度層次規則：**
- 主要元素：`fill="#fff"`（100%）
- 次要元素：`fill="#ffffffcc"`（80%）
- 背景裝飾：`fill="#ffffffaa"`（67%）/ `fill="#ffffff66"`（40%）/ `fill="#ffffff55"`（33%）

---

## Git 資訊

- **分支**：`feature/responsive-pixel-icons`
- **Commit**：`feat: 響應式版面 + 像素風 SVG 圖示`
- **合併至**：`main`
