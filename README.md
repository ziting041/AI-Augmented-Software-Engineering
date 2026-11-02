# AI-Augmented-Software-Engineering

測驗網站：管理員出題，使用者作答。技術規範請見 [ARCHITECTURE.md](ARCHITECTURE.md)。

## 開發環境設定

### 1. 安裝套件

```bash
git clone https://github.com/ziting041/AI-Augmented-Software-Engineering.git
cd AI-Augmented-Software-Engineering
npm install
```

### 2. 設定 Firebase 環境變數

```bash
cp .env.example .env.local
```

在 `.env.local` 填入 6 個 `NEXT_PUBLIC_FIREBASE_*` 的值。取得方式擇一：

- 向專案負責人索取。
- 自行用 Firebase CLI 取得（需已加入 Firebase 專案 `ai-ase-3ea87` 的成員）：

  ```bash
  npm install -g firebase-tools
  firebase login
  firebase apps:sdkconfig web
  ```

> `.env.local` 已被 `.gitignore` 排除，請勿提交。

### 3. 啟動開發伺服器

```bash
npm run dev
```

開啟 <http://localhost:3000>。

## 常用指令

| 指令                | 用途                   |
| ------------------- | ---------------------- |
| `npm run dev`       | 啟動開發伺服器         |
| `npm run build`     | 建置正式版本           |
| `npm run lint`      | 執行 ESLint            |
| `npm run test:unit` | 執行 Vitest 單元測試   |
| `npx playwright test` | 執行 Playwright E2E 測試 |

開 PR 前請確認 `lint`、`test:unit`、Playwright 測試皆通過。

## Firebase

- Client SDK 初始化：`lib/firebase/client.ts`。元件不要直接 import，請透過 `lib/` 中的 repository 介面存取資料。
- Firestore 安全規則：`firestore.rules`（目前全部拒絕）。修改後部署：

  ```bash
  firebase deploy --only firestore:rules
  ```
