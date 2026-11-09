"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { getRepositories } from "@/lib/data"
import { useRepositoryData } from "@/lib/data/hooks"
import { determineResult, selectOption } from "@/lib/quiz/scoring"
import type { Answers, Quiz, ResultType } from "@/lib/quiz/types"
import { QuestionStage } from "./quiz/question-stage"
import { QuizCover } from "./quiz/quiz-cover"
import { ResultSpread } from "./quiz/result-spread"
import { EmptyState, ErrorState, LoadingState } from "./status-message"

export function QuizPlayer({ quizId }: { quizId: string }) {
  const state = useRepositoryData(`quiz:${quizId}`, (repos) => repos.quizzes.get(quizId))

  if (state.status === "loading") return <LoadingState label="正在翻到這一頁…" />
  if (state.status === "error") return <ErrorState message={state.message} onRetry={state.reload} />
  if (!state.data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <EmptyState title="找不到這份測驗">
          <p className="text-sm text-ink-soft">這一頁可能已被撕下，或還沒有付印（未發布）。</p>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            回到目錄
          </Link>
        </EmptyState>
      </div>
    )
  }
  return <QuizSession key={state.data.id} quiz={state.data} />
}

type Stage =
  | { name: "cover" }
  | { name: "question"; index: number; direction: 1 | -1 }
  | { name: "result"; result: ResultType; answers: Answers }

/** 單選題選擇後自動翻頁前的停頓，讓使用者看到選取回饋 */
const AUTO_ADVANCE_MS = 420

function QuizSession({ quiz }: { quiz: Quiz }) {
  const [stage, setStage] = useState<Stage>({ name: "cover" })
  const [answers, setAnswers] = useState<Answers>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }, [])
  useEffect(() => clearTimer, [clearTimer])

  // 換頁時捲回頂端，避免手機上停在頁面中段
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [stage])

  const goTo = useCallback(
    (index: number, direction: 1 | -1) => {
      clearTimer()
      setStage({ name: "question", index, direction })
    },
    [clearTimer],
  )

  function finish(finalAnswers: Answers) {
    clearTimer()
    const result = determineResult(quiz, finalAnswers)
    setStage({ name: "result", result, answers: finalAnswers })
    // 匿名記錄結果；失敗不影響使用者看到結果
    getRepositories()
      .then((repos) => repos.submissions.submit(quiz.id, result.id))
      .catch((error: unknown) => console.warn("記錄作答結果失敗", error))
  }

  function restart() {
    clearTimer()
    setAnswers({})
    setStage({ name: "cover" })
  }

  if (stage.name === "cover") {
    return <QuizCover quiz={quiz} onStart={() => goTo(0, 1)} />
  }

  if (stage.name === "result") {
    return (
      <ResultSpread quiz={quiz} answers={stage.answers} result={stage.result} onRestart={restart} />
    )
  }

  const { index, direction } = stage
  const question = quiz.questions[index]
  const isLast = index === quiz.questions.length - 1

  return (
    <QuestionStage
      key={question.id}
      quiz={quiz}
      index={index}
      direction={direction}
      selected={answers[question.id] ?? []}
      onSelect={(optionId, checked) => {
        const next = selectOption(answers, question, optionId, checked)
        setAnswers(next)
        if (question.type === "single" && !isLast) {
          clearTimer()
          timer.current = setTimeout(() => goTo(index + 1, 1), AUTO_ADVANCE_MS)
        }
      }}
      onPrev={() => goTo(index - 1, -1)}
      onNext={() => (isLast ? finish(answers) : goTo(index + 1, 1))}
    />
  )
}
