# 架構說明（ARCHITECTURE）

本文件是專案的技術規範來源。`.github/copilot-instructions.md` 只保留摘要，細節都寫在這裡。

## 1. 產品範圍（第一版）

- 測驗網站：**管理員出題，使用者作答**。
- 題型：**單選題**、**多選題**。
- 第一版不包含：計時、作答紀錄、排行榜、隨機排序、登入。

## 2. 技術棧

| 項目         | 選用                                |
| ------------ | ----------------------------------- |
| 語言         | TypeScript（`strict: true`）        |
| 框架         | Next.js（App Router），前端為 React |
| 樣式         | Tailwind CSS + shadcn/ui            |
| 單元測試     | Vitest                              |
| E2E 測試     | Playwright                          |
| 後端（之後） | Firebase Auth、Firestore            |

## 3. 目錄結構

```
app/                    路由（App Router）
components/ui/          原始 UI 元件（shadcn/ui），不含業務邏輯
components/features/    功能元件（組合 ui 元件，呼叫 lib/）
lib/                    核心邏輯（領域模型、評分、資料存取）
tests/e2e/*.spec.ts     Playwright 關鍵流程測試
```

## 4. 程式慣例

- **UI 保持呈現用途**：元件只負責顯示與事件轉發，評分、驗證、資料存取等邏輯一律放在 `lib/`。
- **資料存取透過介面**：元件不直接碰 `localStorage` 或 Firebase，而是呼叫 `lib/` 中的 repository 介面，日後換成 Firestore 時只需替換實作。
- **樣式**：使用 shadcn/ui 元件；合併 className 一律用 `cn()`（`lib/utils.ts`）；顏色、圓角等只使用 `app/globals.css` 中定義的 CSS 變數，不寫死色碼。
- **依賴套件**：未經核准不得新增 npm 套件。

## 5. 在地化

- 所有 UI 文字使用繁體中文（zh-TW），採台灣用語。
- 用語對照：使用者（非「用戶」）、專案（非「項目」）、資訊（非「信息」）、預設（非「默認」）。

## 6. Firebase 邊界（接上後端時適用）

- 前端只能 import `lib/firebase/client.ts`（Client SDK）。
- `lib/firebase/server.ts`（Admin SDK）只能在伺服器端使用（Server Components、Route Handlers、Server Actions），不可被 client component 引用。
- 服務金鑰與 `.env*` 檔案絕不提交。

## 7. 測試與驗證

- 領域邏輯（例如評分）以 Vitest 測試。
- 關鍵使用流程（例如：作答並看到分數、管理員新增測驗）以 Playwright 測試，放在 `tests/e2e/*.spec.ts`。
- 開 PR 前必須通過：

  ```bash
  npm run lint
  npm run test:unit
  npx playwright test
  ```

## 8. Git 規範

- 遵循 Conventional Commits：`feat:`、`fix:`、`refactor:`、`test:` 等。
- 每個 commit 保持單一目的（atomic）。
- 不執行破壞性 git 指令（如 `reset --hard`、`push --force`）。
