import type { Repositories } from "./types"

export * from "./types"

let repositories: Promise<Repositories> | null = null

/**
 * 取得資料存取實作（僅能在瀏覽器端呼叫）。
 * 預設使用 Firebase；設定 NEXT_PUBLIC_DATA_BACKEND=local 時改用 localStorage（E2E 測試與離線展示用）。
 * 使用動態 import，避免 local 模式下初始化 Firebase。
 */
export function getRepositories(): Promise<Repositories> {
  repositories ??=
    process.env.NEXT_PUBLIC_DATA_BACKEND === "local"
      ? import("./local").then((m) => m.createLocalRepositories())
      : import("./firebase").then((m) => m.createFirebaseRepositories())
  return repositories
}
