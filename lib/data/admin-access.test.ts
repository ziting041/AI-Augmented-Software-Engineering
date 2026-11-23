import { describe, expect, it } from "vitest"

import { resolveAdminAccess } from "./admin-access"

describe("resolveAdminAccess", () => {
  it("[AC-6.1] 未登入時要求登入，不放行", () => {
    expect(resolveAdminAccess({ status: "signed-out" })).toEqual({ kind: "require-login" })
  })

  it("[AC-6.2] 已登入但沒有管理權限時拒絕存取並提示", () => {
    expect(
      resolveAdminAccess({ status: "signed-in", email: "user@example.com", isAdmin: false }),
    ).toEqual({ kind: "forbidden", email: "user@example.com" })
  })

  it("[AC-6.3] 權限被撤銷後，最新的登入狀態立即改為拒絕", () => {
    const before = resolveAdminAccess({ status: "signed-in", email: "a@example.com", isAdmin: true })
    const after = resolveAdminAccess({ status: "signed-in", email: "a@example.com", isAdmin: false })
    expect(before.kind).toBe("granted")
    expect(after.kind).toBe("forbidden")
  })

  it("[AC-6.4] 登入逾期（工作階段失效視為登出）時要求重新登入", () => {
    expect(resolveAdminAccess({ status: "signed-out" }).kind).toBe("require-login")
  })

  it("[AC-6.5] 具有管理權限時放行", () => {
    expect(
      resolveAdminAccess({ status: "signed-in", email: "admin@example.com", isAdmin: true }),
    ).toEqual({ kind: "granted", email: "admin@example.com" })
  })

  it("[AC-6.1] 確認中或驗證失敗時不放行", () => {
    expect(resolveAdminAccess({ status: "loading" }).kind).toBe("checking")
    expect(resolveAdminAccess({ status: "error", message: "x" })).toEqual({
      kind: "error",
      message: "x",
    })
  })
})
