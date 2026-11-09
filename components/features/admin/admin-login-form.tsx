"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getRepositories, toUserMessage } from "@/lib/data"
import { useAdminSession, useBackend } from "@/lib/data/hooks"
import { LOCAL_DEMO_ADMIN } from "@/lib/data/local"

export function AdminLoginForm() {
  const router = useRouter()
  const session = useAdminSession()
  const backend = useBackend()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = session.status === "signed-in" && session.isAdmin
  useEffect(() => {
    if (isAdmin) router.replace("/admin")
  }, [isAdmin, router])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const repos = await getRepositories()
      await repos.auth.signIn(email.trim(), password)
    } catch (err) {
      setError(toUserMessage(err, "登入失敗，請稍後再試"))
    } finally {
      setSubmitting(false)
    }
  }

  const notAdmin = session.status === "signed-in" && !session.isAdmin

  return (
    <Card className="mx-auto w-full max-w-sm">
      <form onSubmit={handleSubmit} className="contents">
        <CardHeader>
          <CardTitle className="font-serif text-2xl font-black">管理員登入</CardTitle>
          <CardDescription>登入後即可新增、編輯測驗並查看統計。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">電子郵件</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">密碼</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {notAdmin && (
            <p role="alert" className="text-sm text-destructive">
              {session.email} 不在管理員名單中，請聯絡專案負責人開通權限。
            </p>
          )}
          {backend === "local" && (
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              本機模式示範帳號：{LOCAL_DEMO_ADMIN.email} ／ {LOCAL_DEMO_ADMIN.password}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "登入中…" : "登入"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
