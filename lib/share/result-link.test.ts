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
  it("creates a link that reopens the calculated result", () => {
    const url = new URL(createResultLink("https://example.test", quiz.id, answers))
    const shared = readSharedResult(quiz, url.searchParams.get("result"))

    expect(url.pathname).toBe("/quiz/sample")
    expect(shared?.answers).toEqual(answers)
    expect(shared?.result.id).toBe("owl")
  })

  it("rejects malformed or invalid shared answers", () => {
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
