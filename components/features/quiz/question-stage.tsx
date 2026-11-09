"use client"

import { useEffect, useRef } from "react"
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react"

import { ChoiceCheckbox, ChoiceRadio } from "@/components/ui/choice"
import { RadioGroup } from "@/components/ui/radio-group"
import { optionIndexFromKey, optionMarker } from "@/lib/quiz/keyboard"
import { isQuestionAnswered } from "@/lib/quiz/scoring"
import type { Quiz } from "@/lib/quiz/types"
import { cn } from "@/lib/utils"

const pad = (n: number) => String(n).padStart(2, "0")

export function QuestionStage({
  quiz,
  index,
  direction,
  selected,
  onSelect,
  onPrev,
  onNext,
}: {
  quiz: Quiz
  index: number
  direction: 1 | -1
  selected: string[]
  onSelect: (optionId: string, checked: boolean) => void
  onPrev: () => void
  onNext: () => void
}) {
  const question = quiz.questions[index]
  const total = quiz.questions.length
  const isLast = index === total - 1
  const answered = isQuestionAnswered(question, selected)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // 換題後把焦點移到題目，螢幕閱讀器會念出新題目
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  // 鍵盤快捷鍵：1–9 / A–Z 選擇、Enter 下一題、← 上一題
  const handlers = useRef({ onSelect, onPrev, onNext, answered, selected })
  useEffect(() => {
    handlers.current = { onSelect, onPrev, onNext, answered, selected }
  })
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return
      const target = event.target as HTMLElement | null
      if (target?.closest("input, textarea, [contenteditable]")) return
      // 焦點在按鈕或連結上時，Enter 交給元素本身處理，避免重複翻頁
      if (event.key === "Enter" && target?.closest("button, a")) return
      const h = handlers.current
      if (event.key === "Enter" && h.answered) {
        event.preventDefault()
        h.onNext()
        return
      }
      if (event.key === "ArrowLeft" && index > 0) {
        h.onPrev()
        return
      }
      const optionIndex = optionIndexFromKey(event.key, question.options.length)
      if (optionIndex === null) return
      const option = question.options[optionIndex]
      event.preventDefault()
      h.onSelect(option.id, question.type === "single" ? true : !h.selected.includes(option.id))
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [index, question])

  const headingId = `question-${question.id}`

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-6 pb-10 sm:px-6 md:pt-10">
      {/* 頁眉：專題名＋進度 */}
      <div className="grid gap-3">
        <div className="flex items-baseline justify-between gap-4 text-xs tracking-[0.15em] uppercase">
          <span className="truncate text-ink-soft">{quiz.title}</span>
          <span className="shrink-0 font-display text-base tracking-normal normal-case italic font-wonk">
            第 {index + 1} / {total} 題
          </span>
        </div>
        <div
          className="flex gap-1.5"
          role="progressbar"
          aria-label="作答進度"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
          aria-valuetext={`第 ${index + 1} 題，共 ${total} 題`}
        >
          {quiz.questions.map((q, i) => (
            <span
              key={q.id}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-500",
                i < index ? "bg-ink" : i === index ? "bg-coral" : "bg-ink/15",
              )}
            />
          ))}
        </div>
      </div>

      <div
        className={cn(
          "grid flex-1 gap-6 pt-8 md:grid-cols-12 md:gap-10 md:pt-14",
          direction === 1 ? "animate-page-in" : "animate-page-in-back",
        )}
      >
        {/* 巨大題號 */}
        <div aria-hidden className="flex items-end gap-3 md:col-span-4 md:flex-col md:items-start">
          <span className="font-display text-[5.5rem] leading-[0.8] font-light text-outline font-soft sm:text-[8rem] md:text-[11rem]">
            {pad(index + 1)}
          </span>
          <span className="pb-2 font-display text-xl italic text-ink-soft font-wonk md:pb-0 md:pl-2">
            / {pad(total)}
          </span>
        </div>

        <div className="flex flex-col gap-6 md:col-span-8">
          <div className="grid gap-3">
            <p className="flex items-center gap-2 text-sm text-ink-soft">
              <Sparkles className="size-4 text-coral" aria-hidden />
              {question.type === "single"
                ? isLast
                  ? "單選・選好後揭曉結果"
                  : "單選・選了就會自動翻頁"
                : "可複選・選好後按「下一題」"}
            </p>
            <h2
              id={headingId}
              ref={headingRef}
              tabIndex={-1}
              className="font-serif text-[clamp(1.7rem,4.2vw,2.8rem)] leading-snug font-bold text-balance-cjk outline-none"
            >
              {question.text}
            </h2>
          </div>

          {question.type === "single" ? (
            <RadioGroup
              aria-labelledby={headingId}
              className="gap-0"
              value={selected[0] ?? null}
              onValueChange={(value) => onSelect(String(value), true)}
            >
              {question.options.map((option, i) => (
                <ChoiceRadio key={option.id} value={option.id} marker={optionMarker(i)}>
                  {option.text}
                </ChoiceRadio>
              ))}
            </RadioGroup>
          ) : (
            <div role="group" aria-labelledby={headingId}>
              {question.options.map((option, i) => (
                <ChoiceCheckbox
                  key={option.id}
                  marker={optionMarker(i)}
                  checked={selected.includes(option.id)}
                  onCheckedChange={(checked) => onSelect(option.id, checked)}
                >
                  {option.text}
                </ChoiceCheckbox>
              ))}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={onPrev}
              disabled={index === 0}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink disabled:invisible"
            >
              <ArrowLeft className="size-4" aria-hidden />
              上一題
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!answered}
              className={cn(
                "group inline-flex items-center gap-3 rounded-full py-2.5 pr-2.5 pl-6 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-35",
                isLast
                  ? "bg-coral text-ink hover:bg-ink hover:text-paper"
                  : "bg-ink text-paper hover:bg-coral hover:text-ink",
              )}
            >
              {isLast ? "看結果" : "下一題"}
              <span className="grid size-8 place-items-center rounded-full bg-paper text-ink transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
