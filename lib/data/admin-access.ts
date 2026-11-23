import type { AdminSession } from "./types"

/**
 * 管理後台的存取判斷（畫面層）。真正的資料保護在 Firestore 安全規則與 repository 實作。
 * - 未登入、或登入已逾期（Firebase 會視為登出）→ 導向登入頁，要求登入
 * - 已登入但不是管理員、或權限已被撤銷 → 拒絕並提示
 * - 管理員 → 放行
 */
export type AdminAccess =
  | { kind: "checking" }
  | { kind: "error"; message: string }
  | { kind: "require-login" }
  | { kind: "forbidden"; email: string }
  | { kind: "granted"; email: string }

export function resolveAdminAccess(session: AdminSession): AdminAccess {
  switch (session.status) {
    case "loading":
      return { kind: "checking" }
    case "error":
      return { kind: "error", message: session.message }
    case "signed-out":
      return { kind: "require-login" }
    case "signed-in":
      return session.isAdmin
        ? { kind: "granted", email: session.email }
        : { kind: "forbidden", email: session.email }
  }
}
