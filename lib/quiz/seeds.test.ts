import { describe, expect, it } from "vitest"

import { determineResult } from "./scoring"
import { createSeedQuizzes, missingSeedQuizzes } from "./seeds"
import { validateQuiz } from "./validation"

describe("範例測驗集", () => {
  const seeds = createSeedQuizzes()

  it("[AC-5.6] 共 4 份、標題不重複", () => {
    expect(seeds).toHaveLength(4)
    expect(new Set(seeds.map((q) => q.title)).size).toBe(4)
  })

  it("[AC-5.5] 只回傳尚未匯入的範例測驗", () => {
    expect(missingSeedQuizzes([])).toHaveLength(4)
    const remaining = missingSeedQuizzes([{ title: seeds[0].title }, { title: ` ${seeds[2].title} ` }])
    expect(remaining.map((q) => q.title)).toEqual([seeds[1].title, seeds[3].title])
    expect(missingSeedQuizzes(seeds)).toEqual([])
  })

  it.each(seeds.map((q) => [q.title, q] as const))("[AC-5.6] 「%s」通過驗證且每種結果都能出現", (_, quiz) => {
    expect(validateQuiz(quiz)).toEqual([])
    expect(quiz.published).toBe(true)
    const reached = new Set(
      quiz.results.map((_, i) => {
        const answers = Object.fromEntries(quiz.questions.map((q) => [q.id, [q.options[i].id]]))
        return determineResult(quiz, answers).id
      }),
    )
    expect(reached.size).toBe(quiz.results.length)
  })
})
