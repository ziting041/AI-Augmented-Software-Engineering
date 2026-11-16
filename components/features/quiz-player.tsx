"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { getRepositories } from "@/lib/data"
import { useRepositoryData } from "@/lib/data/hooks"
import { getAnswerValidationErrors, determineResult, selectOption } from "@/lib/quiz/scoring"
import type { Answers, Quiz, ResultType } from "@/lib/quiz/types"
import { isPlayableQuiz } from "@/lib/quiz/validation"
import { readSharedResult } from "@/lib/share/result-link"
import { QuestionStage } from "./quiz/question-stage"
import { QuizCover } from "./quiz/quiz-cover"
import { ResultSpread } from "./quiz/result-spread"
import { EmptyState, ErrorState, LoadingState } from "./status-message"

export function QuizPlayer({
  quizId,
  sharedResult,
}: {
  quizId: string
  sharedResult?: string | string[]
}) {
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
  if (!isPlayableQuiz(state.data)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <EmptyState title="測驗目前無法使用">
          <p className="text-sm text-ink-soft">這份測驗內容不完整或尚未發布，請回到目錄挑選其他測驗。</p>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            回到目錄
          </Link>
        </EmptyState>
      </div>
    )
  }

  const result = sharedResult === undefined ? undefined : readSharedResult(state.data, sharedResult)
  if (sharedResult !== undefined && !result) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <EmptyState title="結果無法取得">
          <p className="text-sm text-ink-soft">分享連結無效或內容已變更，請重新作答取得結果。</p>
          <Link href={`/quiz/${state.data.id}`} className={buttonVariants({ variant: "outline" })}>
            重新作答
          </Link>
        </EmptyState>
      </div>
    )
  }

  return (
    <QuizSession
      key={state.data.id}
      quiz={state.data}
      sharedResult={result ?? undefined}
    />
  )
}

type Stage =
  | { name: "cover" }
  | { name: "question"; index: number; direction: 1 | -1 }
  | { name: "result"; result: ResultType; answers: Answers }

/** 單選題選擇後自動翻頁前的停頓，讓使用者看到選取回饋 */
const AUTO_ADVANCE_MS = 420

function QuizSession({
  quiz,
  sharedResult,
}: {
  quiz: Quiz
  sharedResult?: { answers: Answers; result: ResultType }
}) {
  const [stage, setStage] = useState<Stage>(() =>
    sharedResult
      ? { name: "result", result: sharedResult.result, answers: sharedResult.answers }
      : { name: "cover" },
  )
  const [answers, setAnswers] = useState<Answers>(() => sharedResult?.answers ?? {})
  const [answerError, setAnswerError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const submitting = useRef(false)

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
    if (submitting.current) return
    clearTimer()
    const errors = getAnswerValidationErrors(quiz, finalAnswers)
    if (errors.length > 0) {
      setAnswerError(
        errors.includes("尚有題目未作答")
          ? "尚有題目未完成，請返回檢查後再看結果。"
          : "答案無效，請返回檢查並重新選擇。",
      )
      return
    }

    submitting.current = true
    let result: ResultType
    try {
      result = determineResult(quiz, finalAnswers)
    } catch (error) {
      submitting.current = false
      setAnswerError(error instanceof Error ? error.message : "答案無效，請返回檢查並重新選擇。")
      return
    }
    setStage({ name: "result", result, answers: finalAnswers })
    setAnswerError(null)
    // 匿名記錄結果；失敗不影響使用者看到結果
    getRepositories()
      .then((repos) => repos.submissions.submit(quiz.id, result.id))
      .catch((error: unknown) => console.warn("記錄作答結果失敗", error))
  }

  function restart() {
    clearTimer()
    submitting.current = false
    setAnswers({})
    setAnswerError(null)
    window.history.replaceState(null, "", `/quiz/${encodeURIComponent(quiz.id)}`)
    setStage({ name: "cover" })
  }

  if (stage.name === "cover") {
    return <QuizCover quiz={quiz} onStart={() => goTo(0, 1)} />
  }

  if (stage.name === "result") {
    return (
      <ResultSpread
        quiz={quiz}
        answers={stage.answers}
        result={stage.result}
        onRestart={restart}
      />
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
        setAnswerError(null)
        if (question.type === "single" && !isLast) {
          clearTimer()
          timer.current = setTimeout(() => goTo(index + 1, 1), AUTO_ADVANCE_MS)
        }
      }}
      onPrev={() => goTo(index - 1, -1)}
      onNext={() => (isLast ? finish(answers) : goTo(index + 1, 1))}
      errorMessage={answerError}
    />
  )
}
