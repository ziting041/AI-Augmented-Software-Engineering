// 測驗編輯器使用的純函式：每個函式都回傳新的 QuizDraft，不修改原物件。
import type { Option, Question, QuestionType, QuizDraft, ResultType } from "./types"

export function createId(): string {
  return crypto.randomUUID()
}

export function createEmptyResult(): ResultType {
  return { id: createId(), title: "", description: "" }
}

export function createEmptyOption(): Option {
  return { id: createId(), text: "", scores: {} }
}

export function createEmptyQuestion(): Question {
  return {
    id: createId(),
    text: "",
    type: "single",
    options: [createEmptyOption(), createEmptyOption()],
  }
}

export function createEmptyQuiz(): QuizDraft {
  return {
    title: "",
    description: "",
    published: false,
    results: [createEmptyResult(), createEmptyResult()],
    questions: [createEmptyQuestion()],
  }
}

type DraftFields = Pick<QuizDraft, "title" | "description" | "published">

export function updateQuizFields(
  draft: QuizDraft,
  fields: Partial<DraftFields>,
): QuizDraft {
  return { ...draft, ...fields }
}

// ---- 結果類型 ----

export function addResult(draft: QuizDraft): QuizDraft {
  return { ...draft, results: [...draft.results, createEmptyResult()] }
}

export function updateResult(
  draft: QuizDraft,
  resultId: string,
  fields: Partial<Omit<ResultType, "id">>,
): QuizDraft {
  return {
    ...draft,
    results: draft.results.map((r) =>
      r.id === resultId ? { ...r, ...fields } : r,
    ),
  }
}

/** 刪除結果類型時，一併移除所有選項中對應的分數 */
export function removeResult(draft: QuizDraft, resultId: string): QuizDraft {
  return {
    ...draft,
    results: draft.results.filter((r) => r.id !== resultId),
    questions: draft.questions.map((q) => ({
      ...q,
      options: q.options.map((o) => {
        const scores = { ...o.scores }
        delete scores[resultId]
        return { ...o, scores }
      }),
    })),
  }
}

// ---- 題目 ----

export function addQuestion(draft: QuizDraft): QuizDraft {
  return { ...draft, questions: [...draft.questions, createEmptyQuestion()] }
}

function mapQuestion(
  draft: QuizDraft,
  questionId: string,
  fn: (q: Question) => Question,
): QuizDraft {
  return {
    ...draft,
    questions: draft.questions.map((q) => (q.id === questionId ? fn(q) : q)),
  }
}

export function updateQuestion(
  draft: QuizDraft,
  questionId: string,
  fields: { text?: string; type?: QuestionType },
): QuizDraft {
  return mapQuestion(draft, questionId, (q) => ({ ...q, ...fields }))
}

export function removeQuestion(draft: QuizDraft, questionId: string): QuizDraft {
  return {
    ...draft,
    questions: draft.questions.filter((q) => q.id !== questionId),
  }
}

export function moveQuestion(
  draft: QuizDraft,
  questionId: string,
  direction: -1 | 1,
): QuizDraft {
  const index = draft.questions.findIndex((q) => q.id === questionId)
  const target = index + direction
  if (index < 0 || target < 0 || target >= draft.questions.length) return draft
  const questions = [...draft.questions]
  ;[questions[index], questions[target]] = [questions[target], questions[index]]
  return { ...draft, questions }
}

// ---- 選項 ----

export function addOption(draft: QuizDraft, questionId: string): QuizDraft {
  return mapQuestion(draft, questionId, (q) => ({
    ...q,
    options: [...q.options, createEmptyOption()],
  }))
}

export function updateOptionText(
  draft: QuizDraft,
  questionId: string,
  optionId: string,
  text: string,
): QuizDraft {
  return mapQuestion(draft, questionId, (q) => ({
    ...q,
    options: q.options.map((o) => (o.id === optionId ? { ...o, text } : o)),
  }))
}

/** 分數為 0 時不存入 scores，保持資料精簡 */
export function setOptionScore(
  draft: QuizDraft,
  questionId: string,
  optionId: string,
  resultId: string,
  points: number,
): QuizDraft {
  return mapQuestion(draft, questionId, (q) => ({
    ...q,
    options: q.options.map((o) => {
      if (o.id !== optionId) return o
      const scores = { ...o.scores }
      if (points === 0 || Number.isNaN(points)) delete scores[resultId]
      else scores[resultId] = points
      return { ...o, scores }
    }),
  }))
}

export function removeOption(
  draft: QuizDraft,
  questionId: string,
  optionId: string,
): QuizDraft {
  return mapQuestion(draft, questionId, (q) => ({
    ...q,
    options: q.options.filter((o) => o.id !== optionId),
  }))
}

/** 從已存檔的測驗取出可編輯的內容 */
export function toDraft(quiz: QuizDraft): QuizDraft {
  return {
    title: quiz.title,
    description: quiz.description,
    published: quiz.published,
    results: quiz.results,
    questions: quiz.questions,
  }
}
