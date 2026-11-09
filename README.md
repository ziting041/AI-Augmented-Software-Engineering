# AI-Augmented-Software-Engineering

心理測驗網站：管理員出題，使用者作答並得到結果類型。技術規範請見 [ARCHITECTURE.md](ARCHITECTURE.md)。

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

> 不想連 Firebase、只想看畫面？用本機模式啟動，資料存在瀏覽器 localStorage，並內建範例測驗：
>
> ```bash
> NEXT_PUBLIC_DATA_BACKEND=local npm run dev
> ```
>
> 本機模式的示範管理員帳號：`admin@example.com` ／ `admin1234`。

### 4. 設定管理員（Firebase 模式）

1. Firebase Console → Authentication → Sign-in method，啟用 **Email/Password**。
2. Authentication → Users → 新增使用者，記下該使用者的 **UID**。
3. Firestore Database → 建立集合 `admins`，新增一份文件，**文件 ID 填入上一步的 UID**（欄位可留空，或加上 `email` 方便辨識）。
4. 部署安全規則：`firebase deploy --only firestore:rules`。
5. 到 <http://localhost:3000/admin/login> 登入，可先按「匯入範例測驗」試用。

## 常用指令

| 指令                | 用途                   |
| ------------------- | ---------------------- |
| `npm run dev`       | 啟動開發伺服器         |
| `npm run build`     | 建置正式版本           |
| `npm run lint`      | 執行 ESLint            |
| `npm run test:unit` | 執行 Vitest 單元測試   |
| `npm run test:e2e`  | 執行 Playwright E2E 測試（本機模式，port 3100） |

開 PR 前請確認 `lint`、`test:unit`、Playwright 測試皆通過。

## Firebase

- Client SDK 初始化：`lib/firebase/client.ts`。元件不要直接 import，請透過 `lib/` 中的 repository 介面存取資料。
- 資料存取：`lib/data/`（`firebase.ts` 為正式實作、`local.ts` 為本機模式）。
- Firestore 安全規則：`firestore.rules`（已發布測驗公開可讀；寫入限管理員；作答紀錄匿名新增、僅管理員可讀）。修改後部署：

  ```bash
  firebase deploy --only firestore:rules
  ```
