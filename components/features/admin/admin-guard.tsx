"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button, buttonVariants } from "@/components/ui/button"
import { getRepositories } from "@/lib/data"
import { resolveAdminAccess } from "@/lib/data/admin-access"
import { useAdminSession } from "@/lib/data/hooks"
import { EmptyState, ErrorState, LoadingState } from "../status-message"

/**
 * 管理頁面的畫面守門。真正的權限檢查在 Firestore 安全規則，
 * 這裡只負責導向登入頁與顯示對應訊息。
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const access = resolveAdminAccess(useAdminSession())

  useEffect(() => {
    if (access.kind === "require-login") router.replace("/admin/login")
  }, [access.kind, router])

  if (access.kind === "error") {
    return (
      <ErrorState
        message={access.message}
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (access.kind === "checking" || access.kind === "require-login") {
    return <LoadingState label="確認登入狀態…" />
  }

  if (access.kind === "forbidden") {
    return (
      <EmptyState title="你沒有管理員權限">
        <p className="text-sm text-muted-foreground">
          目前登入的帳號 {access.email} 不在管理員名單中，或權限已被撤銷。
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => getRepositories().then((r) => r.auth.signOut())}
          >
            登出
          </Button>
          <Link href="/" className={buttonVariants({ variant: "ghost" })}>
            回首頁
          </Link>
        </div>
      </EmptyState>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>已登入：{access.email}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => getRepositories().then((r) => r.auth.signOut())}
        >
          登出
        </Button>
      </div>
      {children}
    </div>
  )
}
