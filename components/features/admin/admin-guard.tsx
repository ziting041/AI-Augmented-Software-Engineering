"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button, buttonVariants } from "@/components/ui/button"
import { getRepositories } from "@/lib/data"
import { useAdminSession } from "@/lib/data/hooks"
import { EmptyState, LoadingState } from "../status-message"

/**
 * 管理頁面的畫面守門。真正的權限檢查在 Firestore 安全規則，
 * 這裡只負責導向登入頁與顯示對應訊息。
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const session = useAdminSession()

  useEffect(() => {
    if (session.status === "signed-out") router.replace("/admin/login")
  }, [session.status, router])

  if (session.status !== "signed-in") return <LoadingState label="確認登入狀態…" />

  if (!session.isAdmin) {
    return (
      <EmptyState title="你沒有管理員權限">
        <p className="text-sm text-muted-foreground">
          目前登入的帳號 {session.email} 不在管理員名單中。
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
        <span>已登入：{session.email}</span>
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
