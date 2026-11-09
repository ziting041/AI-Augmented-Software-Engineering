"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useRepositoryData } from "@/lib/data/hooks"
import { summarizeStats } from "@/lib/quiz/stats"
import { EmptyState, ErrorState, LoadingState } from "../status-message"

export function QuizStats({ quizId }: { quizId: string }) {
  const state = useRepositoryData(`stats:${quizId}`, async (repos) => {
    const quiz = await repos.quizzes.get(quizId)
    if (!quiz) return null
    const counts = await repos.submissions.countByResult(
      quizId,
      quiz.results.map((r) => r.id),
    )
    return { quiz, stats: summarizeStats(quiz.results, counts) }
  })

  if (state.status === "loading") return <LoadingState />
  if (state.status === "error")
    return <ErrorState message={state.message} onRetry={state.reload} />
  if (!state.data) return <EmptyState title="找不到這份測驗" />

  const { quiz, stats } = state.data

  return (
    <section className="grid gap-4">
      <Link
        href="/admin"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "justify-self-start" })}
      >
        <ArrowLeft data-icon="inline-start" aria-hidden />
        回到測驗管理
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl font-black">{quiz.title}・作答統計</CardTitle>
          <CardDescription>
            共 <span data-testid="stats-total">{stats.total}</span> 人次完成測驗（匿名記錄）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-4">
            {stats.items.map(({ result, count, percent }) => (
              <li key={result.id} className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{result.title}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {count} 人・{percent}%
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="meter"
                  aria-label={`${result.title} 佔比`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                >
                  <div className="h-full bg-coral" style={{ width: `${percent}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}
