import { determineResult, isQuizComplete } from "@/lib/quiz/scoring"
import type { Answers, Quiz, ResultType } from "@/lib/quiz/types"

const MAX_RESULT_LENGTH = 32_768

export function createResultLink(origin: string, quizId: string, answers: Answers): string {
  const url = new URL(`/quiz/${encodeURIComponent(quizId)}`, origin)
  url.searchParams.set("result", JSON.stringify(answers))
  return url.toString()
}

export function readSharedResult(
  quiz: Quiz,
  token: unknown,
): { answers: Answers; result: ResultType } | null {
  if (typeof token !== "string" || token.length === 0 || token.length > MAX_RESULT_LENGTH) {
    return null
  }

  let answers: unknown
  try {
    answers = JSON.parse(token)
  } catch (error) {
    if (error instanceof SyntaxError) return null
    throw error
  }

  if (!isQuizComplete(quiz, answers)) return null
  return { answers, result: determineResult(quiz, answers) }
}
