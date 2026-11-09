"use client"

import { useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { RotateCcw } from "lucide-react"

import { explainResult, rankResults, splitTitle } from "@/lib/quiz/analysis"
import { buildEmblem, personaColorIndex } from "@/lib/quiz/emblem"
import type { Answers, Quiz, ResultType } from "@/lib/quiz/types"
import { cn } from "@/lib/utils"
import { PersonaEmblem } from "../persona-emblem"
import { ResultActions } from "./result-actions"

const pad = (n: number) => String(n).padStart(2, "0")
const percent = (share: number) => `${Math.round(share * 100)}%`

export function ResultSpread({
  quiz,
  answers,
  result,
  onRestart,
}: {
  quiz: Quiz
  answers: Answers
  result: ResultType
  onRestart: () => void
}) {
  const emblemRef = useRef<SVGSVGElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const analysis = useMemo(() => {
    const ranked = rankResults(quiz, answers)
    const winner = ranked.find((r) => r.result.id === result.id) ?? ranked[0]
    const runnerUp = ranked.find((r) => r.result.id !== result.id && r.score > 0) ?? null
    const byOrder = [...ranked].sort((a, b) => a.index - b.index)
    const emblem = buildEmblem({
      // 種子包含作答內容：同一份作答得到同一個圖騰
      seed: `${quiz.id}:${JSON.stringify(answers)}`,
      shares: byOrder.map((r) => r.share),
      highlight: winner.index,
    })
    return {
      ranked,
      winner,
      runnerUp,
      emblem,
      evidence: explainResult(quiz, answers, result.id),
    }
  }, [quiz, answers, result])

  const { name, tagline } = splitTitle(result.title)
  const { ranked, winner, runnerUp, emblem, evidence } = analysis
  const winnerColor = `var(--persona-${personaColorIndex(winner.index)})`
  const issueNo = pad(winner.index + 1)
  const today = new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" })

  // 顯影動畫結束後，把焦點移到結果標題
  useEffect(() => {
    const id = setTimeout(() => headingRef.current?.focus({ preventScroll: true }), 1500)
    return () => clearTimeout(id)
  }, [])

  return (
    <article className="relative">
      {/* 顯影遮罩：純裝飾，動畫結束後自動隱藏 */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-40 grid place-items-center bg-night text-paper"
        style={{ animation: "develop 2s var(--ease-dream) forwards" }}
      >
        <p
          className="font-serif text-2xl font-bold tracking-[0.2em]"
          style={{ animation: "develop-text 1.6s var(--ease-dream) both" }}
        >
          正在顯影你的人格…
        </p>
      </div>

      {/* ===== 封面跨頁 ===== */}
      <section className="relative overflow-hidden bg-night text-paper">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -bottom-48 size-[40rem] rounded-full opacity-25 blur-3xl"
          style={{ background: winnerColor }}
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-8 px-4 pt-8 pb-12 sm:px-6 md:grid-cols-12 md:pt-12 md:pb-16">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-paper/40 py-2 text-xs tracking-[0.18em] uppercase md:col-span-12">
            <span className="font-display text-sm tracking-normal normal-case italic font-wonk">
              Persona Issue No.{issueNo}
            </span>
            <span aria-hidden className="h-3 w-px bg-paper/40" />
            <span className="truncate">{quiz.title}</span>
            <span className="ml-auto text-paper/70">{today}</span>
          </div>

          <div
            className="flex flex-col justify-center gap-5 md:col-span-7"
            style={{ animation: "rise 1s var(--ease-dream) 1.4s both" }}
          >
            <p className="font-display text-lg italic text-paper/75 font-wonk">你的本期封面人格是——</p>
            <h1
              ref={headingRef}
              tabIndex={-1}
              data-testid="result-title"
              aria-label={result.title}
              className="outline-none"
            >
              <span className="block font-serif text-[clamp(3.4rem,13vw,9.5rem)] leading-[0.95] font-black tracking-tight text-balance-cjk">
                {name}
              </span>
              {tagline && (
                <span
                  className="mt-4 inline-block font-serif text-[clamp(1.4rem,3.6vw,2.4rem)] font-bold"
                  style={{ color: winnerColor }}
                >
                  {tagline}
                </span>
              )}
            </h1>
            <p className="max-w-md text-paper/70">
              依據你的 {quiz.questions.length} 個回答排版，你的選擇中有{" "}
              <strong className="font-display text-xl text-paper">{percent(winner.share)}</strong> 指向這個人格。
            </p>
          </div>

          <figure className="relative mx-auto w-full max-w-sm md:col-span-5 md:max-w-none md:self-center">
            <div className="relative" style={{ animation: "float 9s ease-in-out 2s infinite" }}>
              <div aria-hidden className="absolute inset-[12%] rounded-full bg-paper" />
              <PersonaEmblem
                ref={emblemRef}
                emblem={emblem}
                title={`${result.title}的人格圖騰`}
                className="relative w-full"
              />
            </div>
            <figcaption className="mt-2 text-center font-display text-sm italic text-paper/70 font-wonk">
              你的人格花冠：花瓣長度＝各人格的得分比例
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ===== 編者按＋光譜 ===== */}
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-12 md:py-20">
        <div className="md:col-span-7">
          <SectionLabel en="The Reading" zh="編者按" />
          <p className="mt-6 font-serif text-xl leading-[1.9] whitespace-pre-line first-letter:float-left first-letter:mt-1 first-letter:mr-3 first-letter:text-[4.2rem] first-letter:leading-[0.85] first-letter:font-black first-letter:text-coral sm:text-[1.35rem]">
            {result.description || "這個人格還沒有說明。"}
          </p>
        </div>

        <div className="md:col-span-5">
          <SectionLabel en="Spectrum" zh="人格光譜" />
          <p className="mt-3 text-sm text-ink-soft">你的回答在每種人格上的分布</p>
          <ol className="mt-6 grid gap-5">
            {ranked.map((item, i) => {
              const isWinner = item.result.id === result.id
              return (
                <li key={item.result.id} className="grid gap-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={cn("text-[0.95rem]", isWinner ? "font-bold" : "text-ink-soft")}>
                      {splitTitle(item.result.title).name}
                      {isWinner && (
                        <span className="ml-2 rounded-full bg-ink px-2 py-0.5 align-middle text-[0.7rem] text-paper">
                          你
                        </span>
                      )}
                    </span>
                    <span className="font-display text-lg font-soft tabular-nums">{percent(item.share)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full border border-ink/70 bg-paper-deep">
                    <div
                      className="h-full origin-left rounded-full border-r border-ink/70"
                      style={{
                        width: `${Math.max(item.share * 100, item.share > 0 ? 3 : 0)}%`,
                        background: `var(--persona-${personaColorIndex(item.index)})`,
                        animation: `bar-grow 1.1s var(--ease-dream) ${1.6 + i * 0.12}s both`,
                      }}
                    />
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* ===== 依據 ===== */}
      {evidence.length > 0 && (
        <section className="border-y border-ink/15 bg-paper-deep/60">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-12 md:py-20">
            <div className="md:col-span-4">
              <SectionLabel en="The Evidence" zh="為什麼是你？" />
              <p className="mt-4 leading-relaxed text-ink-soft">
                結果不是抽籤。這幾個回答為「{name}」加了最多分，是讓你的人格成形的關鍵。
              </p>
              {runnerUp && (
                <p className="mt-6 border-l-2 border-coral pl-4 leading-relaxed">
                  你的第二人格是
                  <strong className="mx-1 font-serif">{splitTitle(runnerUp.result.title).name}</strong>
                  （{percent(runnerUp.share)}）。
                  {runnerUp.score === winner.score
                    ? "兩者同分，依測驗設定的人格順序，由排在前面的人格勝出。"
                    : "在某些情境裡，你也會展現這一面。"}
                </p>
              )}
            </div>
            <ol className="grid gap-4 md:col-span-8">
              {evidence.map((item) => (
                <li
                  key={item.question.id}
                  className="grid gap-3 rounded-2xl border border-ink bg-paper p-5 shadow-[4px_4px_0_0_var(--ink)] sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-6 sm:p-6"
                >
                  <span className="font-display text-3xl italic font-wonk">Q.{pad(item.questionIndex + 1)}</span>
                  <div className="grid gap-1">
                    <p className="text-sm text-ink-soft">{item.question.text}</p>
                    <p className="font-serif text-lg font-bold">
                      你選了「{item.options.map((o) => o.text).join("」「")}」
                    </p>
                  </div>
                  <span
                    className="justify-self-start rounded-full border border-ink px-3 py-1 font-display text-lg font-soft sm:justify-self-end"
                    style={{ background: winnerColor }}
                  >
                    +{item.points}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ===== 收藏與分享 ===== */}
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-12 md:items-center md:py-20">
        <div className="md:col-span-6">
          <SectionLabel en="Keep this issue" zh="收藏這一期" />
          <p className="mt-4 max-w-md leading-relaxed text-ink-soft">
            下載專屬結果卡（1080 × 1350），或直接分享給朋友，看看他們會長出什麼樣的花冠。
          </p>
        </div>
        <div className="flex flex-col gap-3 md:col-span-6 md:items-end">
          <ResultActions
            emblemRef={emblemRef}
            quiz={quiz}
            issue={`Persona Issue No.${issueNo}`}
            name={name}
            tagline={tagline}
            spectrum={ranked.map((r) => ({
              label: splitTitle(r.result.title).name,
              share: r.share,
              colorVar: `--persona-${personaColorIndex(r.index)}`,
              highlight: r.result.id === result.id,
            }))}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center gap-2 rounded-full border border-ink px-5 py-2.5 transition-colors hover:bg-ink hover:text-paper"
            >
              <RotateCcw className="size-4" aria-hidden />
              再測一次
            </button>
            <Link
              href="/#contents"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
            >
              看看其他測驗
            </Link>
          </div>
        </div>
      </section>
    </article>
  )
}

function SectionLabel({ en, zh }: { en: string; zh: string }) {
  return (
    <h2 className="flex items-baseline gap-3 border-b-2 border-ink pb-2">
      <span className="font-serif text-2xl font-black">{zh}</span>
      <span className="font-display text-lg italic text-ink-soft font-wonk">{en}</span>
    </h2>
  )
}
