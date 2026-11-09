import type { Answers, Question, QuizDraft, ResultType } from "./types"

/** 單選題需剛好選一個，多選題至少選一個；選項必須屬於該題 */
export function isQuestionAnswered(
  question: Question,
  selected: readonly string[] | undefined,
): boolean {
  if (!selected || selected.length === 0) return false
  if (question.type === "single" && selected.length !== 1) return false
  const validIds = new Set(question.options.map((o) => o.id))
  return selected.every((id) => validIds.has(id))
}

/** 作答時點選選項：單選題直接取代，多選題切換勾選狀態（保持選項原順序） */
export function selectOption(
  answers: Answers,
  question: Question,
  optionId: string,
  checked = true,
): Answers {
  if (question.type === "single") {
    return { ...answers, [question.id]: [optionId] }
  }
  const current = new Set(answers[question.id] ?? [])
  if (checked) current.add(optionId)
  else current.delete(optionId)
  return {
    ...answers,
    [question.id]: question.options.map((o) => o.id).filter((id) => current.has(id)),
  }
}

export function isQuizComplete(quiz: QuizDraft, answers: Answers): boolean {
  return quiz.questions.every((q) => isQuestionAnswered(q, answers[q.id]))
}

/** 加總每個結果類型的分數；未出現的結果類型分數為 0 */
export function tallyScores(
  quiz: QuizDraft,
  answers: Answers,
): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const result of quiz.results) totals[result.id] = 0

  for (const question of quiz.questions) {
    const selected = new Set(answers[question.id] ?? [])
    for (const option of question.options) {
      if (!selected.has(option.id)) continue
      for (const [resultId, points] of Object.entries(option.scores)) {
        if (resultId in totals && Number.isFinite(points)) {
          totals[resultId] += points
        }
      }
    }
  }
  return totals
}

/**
 * 判定測驗結果：總分最高者勝出。
 * 同分時以結果類型在測驗中的排列順序決定（排越前面越優先），確保結果可預期。
 */
export function determineResult(quiz: QuizDraft, answers: Answers): ResultType {
  if (quiz.results.length === 0) {
    throw new Error("測驗沒有任何結果類型")
  }
  if (!isQuizComplete(quiz, answers)) {
    throw new Error("尚有題目未作答")
  }

  const totals = tallyScores(quiz, answers)
  let best = quiz.results[0]
  for (const result of quiz.results) {
    if (totals[result.id] > totals[best.id]) best = result
  }
  return best
}
