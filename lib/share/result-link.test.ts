import { describe, expect, it } from "vitest"

import { createSampleQuiz } from "@/lib/quiz/sample"
import type { Answers, Quiz } from "@/lib/quiz/types"
import { createResultLink, readSharedResult } from "./result-link"

const quiz: Quiz = {
  ...createSampleQuiz(),
  id: "sample",
  createdAt: 1,
  updatedAt: 1,
}
const answers: Answers = Object.fromEntries(
  quiz.questions.map((question) => [question.id, [question.options[0].id]]),
)

describe("result share links", () => {
  it("[AC-3.4] 分享連結可重新開啟同一份計算結果", () => {
    const url = new URL(createResultLink("https://example.test", quiz.id, answers))
    const shared = readSharedResult(quiz, url.searchParams.get("result"))

    expect(url.pathname).toBe("/quiz/sample")
    expect(shared?.answers).toEqual(answers)
    expect(shared?.result.id).toBe("owl")
  })

  it("[AC-3.5] 格式錯誤或答案無效的分享連結一律拒絕", () => {
    expect(readSharedResult(quiz, "{")).toBeNull()
    expect(readSharedResult(quiz, "")).toBeNull()
    expect(
      readSharedResult(
        quiz,
        JSON.stringify({ ...answers, q1: ["not-an-option"] }),
      ),
    ).toBeNull()
    expect(readSharedResult(quiz, JSON.stringify({ ...answers, unknown: ["x"] }))).toBeNull()
  })
})
