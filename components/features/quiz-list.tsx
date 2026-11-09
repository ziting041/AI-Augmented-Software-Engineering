"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { useRepositoryData } from "@/lib/data/hooks"
import { buildEmblem } from "@/lib/quiz/emblem"
import { PersonaEmblem } from "./persona-emblem"
import { EmptyState, ErrorState, LoadingState } from "./status-message"

/** 依題數粗估作答時間（每題約 20 秒） */
function estimateMinutes(questionCount: number) {
  return Math.max(1, Math.round((questionCount * 20) / 60))
}

export function QuizList() {
  const state = useRepositoryData("published-quizzes", (repos) =>
    repos.quizzes.listPublished(),
  )

  return (
    <section id="contents" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-24">
      <header className="mb-10 grid gap-2 md:grid-cols-12 md:items-end">
        <h2 className="flex items-baseline gap-3 md:col-span-8">
          <span className="font-serif text-4xl font-black sm:text-5xl">本期目錄</span>
          <span className="font-display text-2xl italic text-ink-soft font-wonk sm:text-3xl">Contents</span>
        </h2>
        <p className="text-ink-soft md:col-span-4 md:text-right">
          {state.status === "success"
            ? `收錄 ${state.data.length} 篇測驗專題`
            : "每一篇，都是一次和自己的對話"}
        </p>
      </header>

      {state.status === "loading" && <LoadingState />}
      {state.status === "error" && <ErrorState message={state.message} onRetry={state.reload} />}
      {state.status === "success" && state.data.length === 0 && (
        <EmptyState title="目前還沒有測驗">
          <p className="text-sm text-ink-soft">本期還在排版中，管理員可以到後台新增測驗。</p>
        </EmptyState>
      )}
      {state.status === "success" && state.data.length > 0 && (
        <ol className="stagger">
          {state.data.map((quiz, i) => {
            const emblem = buildEmblem({
              seed: quiz.id,
              shares: quiz.results.map((_, ri) => 1 / (ri + 1.5)),
              highlight: 0,
            })
            return (
              <li key={quiz.id} className="border-t border-ink/80 last:border-b">
                <Link
                  href={`/quiz/${quiz.id}`}
                  aria-label={`開始「${quiz.title}」`}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-6 transition-colors duration-500 hover:bg-haze/30 sm:gap-8 sm:px-4 md:py-8"
                >
                  <span className="font-display text-5xl leading-none font-light text-outline font-soft transition-colors duration-500 group-hover:text-coral! sm:text-7xl">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="grid gap-2">
                    <span className="font-serif text-2xl leading-tight font-black text-balance-cjk sm:text-4xl">
                      {quiz.title}
                    </span>
                    {quiz.description && (
                      <span className="line-clamp-2 max-w-2xl text-ink-soft">{quiz.description}</span>
                    )}
                    <span className="flex flex-wrap gap-x-3 text-xs tracking-[0.15em] text-ink-soft uppercase">
                      <span>{quiz.questions.length} 題</span>
                      <span aria-hidden>·</span>
                      <span>約 {estimateMinutes(quiz.questions.length)} 分鐘</span>
                      <span aria-hidden>·</span>
                      <span>{quiz.results.length} 種人格</span>
                    </span>
                  </span>
                  <span className="relative grid size-14 place-items-center sm:size-24">
                    <PersonaEmblem
                      emblem={emblem}
                      animated={false}
                      className="absolute inset-0 size-full scale-75 opacity-0 transition-all duration-700 ease-[var(--ease-dream)] group-hover:scale-110 group-hover:rotate-12 group-hover:opacity-100"
                    />
                    <span className="relative grid size-10 place-items-center rounded-full border border-ink bg-paper transition-colors group-hover:bg-ink group-hover:text-paper sm:size-12">
                      <ArrowUpRight className="size-5" aria-hidden />
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
