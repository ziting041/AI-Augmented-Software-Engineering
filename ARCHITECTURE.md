# 架構說明（ARCHITECTURE）

本文件是專案的技術規範來源。`.github/copilot-instructions.md` 只保留摘要，細節都寫在這裡。

## 1. 產品範圍（第一版）

- 心理測驗網站：**管理員出題，使用者作答並得到結果類型**。
- 題型：**單選題**、**多選題**。
- 計分：每個選項可對各「結果類型」加 0～10 分，總分最高者為測驗結果；同分時以結果類型的排列順序決定（`lib/quiz/scoring.ts`）。
- 管理員以 Firebase Auth（Email/密碼）登入；一般使用者不需登入。
- 作答結果匿名記錄（只存測驗 ID、結果類型 ID、時間），供管理員查看各結果的人數統計。
- 第一版不包含：計時、個人作答紀錄、排行榜、隨機排序、使用者登入。

## 2. 技術棧

| 項目         | 選用                                |
| ------------ | ----------------------------------- |
| 語言         | TypeScript（`strict: true`）        |
| 框架         | Next.js（App Router），前端為 React |
| 樣式         | Tailwind CSS + shadcn/ui            |
| 單元測試     | Vitest                              |
| E2E 測試     | Playwright                          |
| 後端         | Firebase Auth、Firestore（Client SDK + 安全規則） |

## 3. 目錄結構

```
app/                    路由（App Router）
components/ui/          原始 UI 元件（shadcn/ui），不含業務邏輯
components/features/    功能元件（組合 ui 元件，呼叫 lib/）
lib/                    核心邏輯（領域模型、評分、資料存取）
  quiz/                 領域模型、計分、驗證、編輯器純函式、統計（附 *.test.ts）
  quiz/analysis.ts      結果頁分析（人格光譜、作答依據），不依賴 AI
  quiz/emblem.ts        人格圖騰（花瓣＝各結果得分比例）的幾何資料
  share/result-card.ts  以 Canvas 產生可下載的結果卡（1080×1350）
  data/                 repository 介面與實作（firebase.ts / local.ts）、React hooks
tests/e2e/*.spec.ts     Playwright 關鍵流程測試
```

### 路由

| 路徑                         | 說明                         |
| ---------------------------- | ---------------------------- |
| `/`                          | 已發布測驗列表               |
| `/quiz/[id]`                 | 作答與顯示結果               |
| `/admin/login`               | 管理員登入                   |
| `/admin`                     | 測驗管理（需管理員）         |
| `/admin/quizzes/new`         | 新增測驗                     |
| `/admin/quizzes/[id]`        | 編輯測驗                     |
| `/admin/quizzes/[id]/stats`  | 作答統計                     |

`app/admin/(protected)/layout.tsx` 以 `AdminGuard` 處理導向與畫面；**真正的權限控管在 Firestore 安全規則**。

### 資料後端切換

元件透過 `getRepositories()`（`lib/data/index.ts`）取得資料存取實作：

- 預設：Firebase（`lib/data/firebase.ts`）。
- `NEXT_PUBLIC_DATA_BACKEND=local`：localStorage（`lib/data/local.ts`），內建範例測驗與示範管理員帳號，僅供 E2E 測試與離線展示。

## 4. 程式慣例

- **UI 保持呈現用途**：元件只負責顯示與事件轉發，評分、驗證、資料存取等邏輯一律放在 `lib/`。
- **資料存取透過介面**：元件不直接碰 `localStorage` 或 Firebase，而是呼叫 `lib/` 中的 repository 介面，日後換成 Firestore 時只需替換實作。
- **設計系統**：品牌概念「心理測驗室 · The Somnambulist（夢遊者月刊）」——紙張、夜墨、珊瑚、霧紫、檸檬五色，所有 token 定義於 `app/globals.css`；字體為 Fraunces（拉丁展示字）、Noto Serif TC（中文標題）、系統黑體（內文）。人格配色以 `--persona-1`～`--persona-6` 依結果類型順序循環。動畫一律尊重 `prefers-reduced-motion`。
- **樣式**：使用 shadcn/ui 元件；合併 className 一律用 `cn()`（`lib/utils.ts`）；顏色、圓角等只使用 `app/globals.css` 中定義的 CSS 變數，不寫死色碼。
- **依賴套件**：未經核准不得新增 npm 套件。

## 5. 在地化

- 所有 UI 文字使用繁體中文（zh-TW），採台灣用語。
- 用語對照：使用者（非「用戶」）、專案（非「項目」）、資訊（非「信息」）、預設（非「默認」）。

## 6. Firebase 邊界

### Firestore 資料結構

| 集合                 | 內容                                                                 | 權限                                       |
| -------------------- | -------------------------------------------------------------------- | ------------------------------------------ |
| `quizzes/{id}`       | title、description、published、results、questions、resultIds、createdAt、updatedAt | 已發布者任何人可讀；寫入與讀草稿限管理員 |
| `submissions/{id}`   | quizId、resultId、createdAt                                          | 任何人可新增（須指向已發布測驗的結果）；僅管理員可讀；不可修改刪除 |
| `admins/{uid}`       | 空文件即可，存在代表該帳號為管理員                                   | 本人可讀；前端不可寫，需於 Console 新增   |

`resultIds` 是 `results` 的 ID 清單，讓安全規則能驗證作答結果是否合法。

### 邊界

- 前端只能 import `lib/firebase/client.ts`（Client SDK）。
- `lib/firebase/server.ts`（Admin SDK）只能在伺服器端使用（Server Components、Route Handlers、Server Actions），不可被 client component 引用。
- 服務金鑰與 `.env*` 檔案絕不提交。

## 7. 測試與驗證

- 領域邏輯（例如評分）以 Vitest 測試。
- 關鍵使用流程（例如：作答並看到結果、管理員新增測驗）以 Playwright 測試，放在 `tests/e2e/*.spec.ts`。Playwright 會以本機模式（`NEXT_PUBLIC_DATA_BACKEND=local`）在 port 3100 啟動 `next dev`，不會連到正式 Firebase；並使用獨立輸出目錄 `.next/e2e`（`NEXT_DIST_DIR`），可與開發中的 `npm run dev` 同時執行。
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
