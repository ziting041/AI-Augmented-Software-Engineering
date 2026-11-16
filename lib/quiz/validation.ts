import type { Option, Question, QuizDraft, ResultType } from "./types"

export const LIMITS = {
  titleMax: 100,
  descriptionMax: 1000,
  categoryMax: 40,
  minResults: 2,
  maxResults: 20,
  minQuestions: 1,
  maxQuestions: 50,
  minOptions: 2,
  maxOptions: 10,
  scoreMin: 0,
  scoreMax: 10,
} as const

/** 驗證測驗內容，回傳錯誤訊息清單（空陣列代表通過） */
export function validateQuiz(draft: QuizDraft): string[] {
  const errors: string[] = []

  const title = draft.title.trim()
  if (!title) errors.push("請輸入測驗標題")
  else if (title.length > LIMITS.titleMax)
    errors.push(`測驗標題不可超過 ${LIMITS.titleMax} 個字`)
  if (draft.description.length > LIMITS.descriptionMax)
    errors.push(`測驗說明不可超過 ${LIMITS.descriptionMax} 個字`)
  const category = draft.category.trim()
  if (!category) errors.push("請選擇或輸入測驗分類")
  else if (category.length > LIMITS.categoryMax)
    errors.push(`測驗分類不可超過 ${LIMITS.categoryMax} 個字`)

  if (draft.results.length < LIMITS.minResults)
    errors.push(`至少需要 ${LIMITS.minResults} 個結果類型`)
  if (draft.results.length > LIMITS.maxResults)
    errors.push(`結果類型不可超過 ${LIMITS.maxResults} 個`)
  draft.results.forEach((result, i) => {
    if (!result.id.trim()) errors.push(`結果類型 ${i + 1}：識別碼不可空白`)
    if (!result.title.trim()) errors.push(`結果類型 ${i + 1}：請輸入名稱`)
  })

  if (draft.questions.length < LIMITS.minQuestions)
    errors.push(`至少需要 ${LIMITS.minQuestions} 道題目`)
  if (draft.questions.length > LIMITS.maxQuestions)
    errors.push(`題目不可超過 ${LIMITS.maxQuestions} 道`)

  const resultIds = new Set(draft.results.map((r) => r.id))
  draft.questions.forEach((question, qi) => {
    const label = `第 ${qi + 1} 題`
    if (!question.id.trim()) errors.push(`${label}：識別碼不可空白`)
    if (!question.text.trim()) errors.push(`${label}：請輸入題目內容`)
    if (question.options.length < LIMITS.minOptions)
      errors.push(`${label}：至少需要 ${LIMITS.minOptions} 個選項`)
    if (question.options.length > LIMITS.maxOptions)
      errors.push(`${label}：選項不可超過 ${LIMITS.maxOptions} 個`)

    question.options.forEach((option, oi) => {
      const optionLabel = `${label}選項 ${oi + 1}`
      if (!option.id.trim()) errors.push(`${optionLabel}：識別碼不可空白`)
      if (!option.text.trim()) errors.push(`${optionLabel}：請輸入選項內容`)
      for (const [resultId, points] of Object.entries(option.scores)) {
        if (!resultIds.has(resultId)) {
          errors.push(`${optionLabel}：分數對應到不存在的結果類型`)
        } else if (
          !Number.isInteger(points) ||
          points < LIMITS.scoreMin ||
          points > LIMITS.scoreMax
        ) {
          errors.push(
            `${optionLabel}：分數須為 ${LIMITS.scoreMin}～${LIMITS.scoreMax} 的整數`,
          )
        }
      }
      if (!Object.values(option.scores).some((points) => points > LIMITS.scoreMin)) {
        errors.push(`${optionLabel}：至少需為一種結果類型設定大於 0 的分數`)
      }
    })
  })

  const allIds = [
    ...draft.results.map((r) => r.id),
    ...draft.questions.flatMap((q) => [q.id, ...q.options.map((o) => o.id)]),
  ]
  if (new Set(allIds).size !== allIds.length) {
    errors.push("資料有重複的識別碼，請重新整理後再試")
  }

  return errors
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isResultType(value: unknown): value is ResultType {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string"
  )
}

function isOption(value: unknown): value is Option {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    isRecord(value.scores) &&
    Object.values(value.scores).every(
      (score) => typeof score === "number" && Number.isFinite(score),
    )
  )
}

function isQuestion(value: unknown): value is Question {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.text === "string" &&
    (value.type === "single" || value.type === "multiple") &&
    Array.isArray(value.options) &&
    value.options.every(isOption)
  )
}

function isQuizDraft(value: unknown): value is QuizDraft {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.category === "string" &&
    typeof value.published === "boolean" &&
    Array.isArray(value.results) &&
    value.results.every(isResultType) &&
    Array.isArray(value.questions) &&
    value.questions.every(isQuestion)
  )
}

/** Published content is listed only when it passes the same validation as the editor. */
export function isPlayableQuiz(value: unknown): value is QuizDraft {
  return isQuizDraft(value) && value.published && validateQuiz(value).length === 0
}
