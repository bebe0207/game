# 標準化工作流程（SOP）

## 目標

建立一套每次需求的標準化開發流程：
1. Bob 提出方案 1~3（含優劣分析）
2. 使用者選擇方案
3. Bob 自動實作、建立 feature branch、合併並 push main
4. Bob 在 `docs/updates/` 建立本次詳細更新紀錄

---

## 流程說明

```
[你說明需求]
    ↓
[Bob 提出方案 1~3，每個方案含優劣]
    ↓
[你選擇方案編號]
    ↓
[Bob 切出 feature/<功能名> 分支]
    ↓
[Bob 實作程式碼]
    ↓
[git add . → git commit → git checkout main → git merge → git push origin main]
    ↓
[Bob 在 docs/updates/YYYY-MM-DD-<功能>.md 寫入詳細更新紀錄]
    ↓
[等待下次需求]
```

---

## 子任務

### Sub-task 1：建立 docs/updates/ 資料夾結構
- **Intent**：確保更新紀錄有固定存放位置與格式範本
- **Expected Outcomes**：`docs/updates/` 資料夾存在；`docs/updates/README.md` 說明命名規則與格式
- **Todo List**：
  - [ ] 建立 `docs/updates/` 資料夾
  - [ ] 建立 `docs/updates/README.md`（包含命名規則、.md 格式範本）
- **Relevant Context**：`docs/` 資料夾已存在
- **Status**：[ ] pending

### Sub-task 2：建立今日更新紀錄（追補）
- **Intent**：將本次 pixel SVG icons 與響應式改版補寫成正式更新紀錄
- **Expected Outcomes**：`docs/updates/2025-07-01-pixel-icons-responsive.md` 存在且完整
- **Todo List**：
  - [ ] 建立 `docs/updates/2025-07-01-pixel-icons-responsive.md`
  - [ ] 填入目標、方案選擇原因、改動檔案清單、每個改動細項
- **Relevant Context**：改動檔案為 `index.html`；內容包含 Bootstrap Icons → Pixel SVG、Grid 響應式斷點
- **Status**：[ ] pending

### Sub-task 3：git commit & push
- **Intent**：將所有變更（含 docs/updates/）上傳到遠端
- **Expected Outcomes**：`git log` 顯示本次 commit；`git push origin main` 成功
- **Todo List**：
  - [ ] git add .
  - [ ] git commit -m "feat: pixel SVG icons + responsive grid + docs/updates structure"
  - [ ] git push origin main
- **Relevant Context**：遠端為 origin/main
- **Status**：[ ] pending

---

## 更新紀錄 .md 格式範本

```markdown
# YYYY-MM-DD — <功能標題>

## 目標
說明本次要達成的目標。

## 方案選擇
| 方案 | 說明 | 選擇原因 |
|------|------|----------|
| 方案 N | ... | ✅ 選擇 |

## 改動檔案清單
| 檔案 | 改動類型 |
|------|---------|
| `path/to/file` | 新增 / 修改 / 刪除 |

## 改動細項

### `path/to/file`
- **行數**：第 X~Y 行
- **說明**：詳細描述改了什麼、為什麼這樣改
```
