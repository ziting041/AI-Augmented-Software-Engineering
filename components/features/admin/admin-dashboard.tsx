"use client"

import { useState } from "react"
import Link from "next/link"
import { BarChart3, Eye, Pencil, Plus, Trash2, Wand2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getRepositories, toUserMessage } from "@/lib/data"
import { useRepositoryData } from "@/lib/data/hooks"
import { createSampleQuiz } from "@/lib/quiz/sample"
import type { Quiz } from "@/lib/quiz/types"
import { EmptyState, ErrorState, LoadingState } from "../status-message"

export function AdminDashboard() {
  const state = useRepositoryData("admin-quizzes", (repos) => repos.quizzes.listAll())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<unknown>, fallback: string) {
    setBusy(true)
    setError(null)
    try {
      await action()
      state.reload()
    } catch (err) {
      setError(toUserMessage(err, fallback))
    } finally {
      setBusy(false)
    }
  }

  function importSample() {
    return run(
      async () => (await getRepositories()).quizzes.create(createSampleQuiz()),
      "無法匯入範例測驗",
    )
  }

  function remove(quiz: Quiz) {
    if (!window.confirm(`確定要刪除「${quiz.title}」嗎？此動作無法復原。`)) return
    return run(
      async () => (await getRepositories()).quizzes.remove(quiz.id),
      "無法刪除測驗",
    )
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-3xl font-black">測驗管理</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={importSample} disabled={busy}>
            <Wand2 data-icon="inline-start" aria-hidden />
            匯入範例測驗
          </Button>
          <Link href="/admin/quizzes/new" className={buttonVariants()}>
            <Plus data-icon="inline-start" aria-hidden />
            新增測驗
          </Link>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {state.status === "loading" && <LoadingState />}
      {state.status === "error" && (
        <ErrorState message={state.message} onRetry={state.reload} />
      )}
      {state.status === "success" && state.data.length === 0 && (
        <EmptyState title="還沒有任何測驗">
          <p className="text-sm text-muted-foreground">
            點選「新增測驗」開始出題，或先匯入範例測驗看看效果。
          </p>
        </EmptyState>
      )}
      {state.status === "success" && state.data.length > 0 && (
        <ul className="grid gap-3">
          {state.data.map((quiz) => (
            <li key={quiz.id}>
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {quiz.title}
                    <Badge variant={quiz.published ? "default" : "outline"}>
                      {quiz.published ? "已發布" : "草稿"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {quiz.questions.length} 題・{quiz.results.length} 種結果
                    {quiz.updatedAt &&
                      `・更新於 ${new Date(quiz.updatedAt).toLocaleString("zh-TW")}`}
                  </CardDescription>
                  <CardAction className="flex gap-1">
                    <Link
                      href={`/quiz/${quiz.id}`}
                      className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                      aria-label={`預覽「${quiz.title}」`}
                      title="預覽"
                    >
                      <Eye aria-hidden />
                    </Link>
                    <Link
                      href={`/admin/quizzes/${quiz.id}/stats`}
                      className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                      aria-label={`「${quiz.title}」的統計`}
                      title="統計"
                    >
                      <BarChart3 aria-hidden />
                    </Link>
                    <Link
                      href={`/admin/quizzes/${quiz.id}`}
                      className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                      aria-label={`編輯「${quiz.title}」`}
                      title="編輯"
                    >
                      <Pencil aria-hidden />
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={busy}
                      onClick={() => remove(quiz)}
                      aria-label={`刪除「${quiz.title}」`}
                      title="刪除"
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </CardAction>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
