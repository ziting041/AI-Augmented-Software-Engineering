"use client"

import { useMemo } from "react"
import { ArrowRight } from "lucide-react"

import { buildEmblem } from "@/lib/quiz/emblem"
import type { Quiz } from "@/lib/quiz/types"
import { PersonaEmblem } from "../persona-emblem"

export function QuizCover({ quiz, onStart }: { quiz: Quiz; onStart: () => void }) {
  const emblem = useMemo(
    () =>
      buildEmblem({
        seed: quiz.id,
        shares: quiz.results.map(() => 1),
        highlight: -1,
      }),
    [quiz],
  )
  const minutes = Math.max(1, Math.round((quiz.questions.length * 20) / 60))

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -left-40 size-[32rem] rounded-full bg-coral/15 blur-3xl"
      />
      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 md:min-h-[calc(100dvh-3.5rem)] md:grid-cols-12 md:items-center md:py-16">
        <div className="stagger flex flex-col gap-6 md:col-span-7">
          <p className="flex items-center gap-3 text-xs tracking-[0.2em] uppercase">
            <span className="rounded-full bg-ink px-3 py-1 text-paper">Feature</span>
            <span className="text-ink-soft">本期專題</span>
            {!quiz.published && (
              <span className="rounded-full border border-coral px-3 py-1 text-coral">草稿預覽</span>
            )}
          </p>
          <h1 className="font-serif text-[clamp(2.4rem,7vw,5.2rem)] leading-[1.05] font-black tracking-tight text-balance-cjk">
            {quiz.title}
          </h1>
          {quiz.description && (
            <p className="max-w-xl text-lg leading-relaxed whitespace-pre-line text-ink-soft first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-5xl first-letter:leading-none first-letter:font-black first-letter:text-coral">
              {quiz.description}
            </p>
          )}
          <dl className="grid max-w-md grid-cols-3 border-y border-ink/80 py-3 text-center">
            <div>
              <dt className="text-xs text-ink-soft">題數</dt>
              <dd className="font-display text-3xl font-soft">{quiz.questions.length}</dd>
            </div>
            <div className="border-x border-ink/20">
              <dt className="text-xs text-ink-soft">閱讀時間</dt>
              <dd className="font-display text-3xl font-soft">
                {minutes}
                <span className="ml-1 text-sm">min</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">人格類型</dt>
              <dd className="font-display text-3xl font-soft">{quiz.results.length}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onStart}
              disabled={quiz.questions.length === 0}
              autoFocus
              className="group inline-flex items-center gap-3 rounded-full bg-ink py-3 pr-3 pl-7 text-lg text-paper transition-colors hover:bg-coral hover:text-ink disabled:opacity-50"
            >
              開始測驗
              <span className="grid size-9 place-items-center rounded-full bg-paper text-ink transition-transform duration-500 ease-[var(--ease-dream)] group-hover:translate-x-1">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </button>
            <p className="hidden text-sm text-ink-soft sm:block">
              可用鍵盤 <kbd className="rounded border border-ink/30 px-1.5 font-mono text-xs">1</kbd>–
              <kbd className="rounded border border-ink/30 px-1.5 font-mono text-xs">4</kbd> 作答、
              <kbd className="rounded border border-ink/30 px-1.5 font-mono text-xs">Enter</kbd> 下一題
            </p>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-sm md:col-span-5 md:max-w-none">
          <div className="animate-float">
            <PersonaEmblem emblem={emblem} className="w-full" />
          </div>
          <p className="mt-3 text-center font-display text-sm italic text-ink-soft font-wonk">
            答完之後，這朵花會長成你的樣子。
          </p>
        </div>
      </div>
    </section>
  )
}
