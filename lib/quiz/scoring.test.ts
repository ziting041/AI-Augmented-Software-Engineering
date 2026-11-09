import { describe, expect, it } from "vitest"

import { createSampleQuiz } from "./sample"
import {
  determineResult,
  isQuestionAnswered,
  isQuizComplete,
  selectOption,
  tallyScores,
} from "./scoring"
import type { Question, QuizDraft } from "./types"

const single: Question = {
  id: "s",
  text: "單選",
  type: "single",
  options: [
    { id: "s1", text: "A", scores: { a: 2 } },
    { id: "s2", text: "B", scores: { b: 2 } },
  ],
}

const multiple: Question = {
  id: "m",
  text: "多選",
  type: "multiple",
  options: [
    { id: "m1", text: "A", scores: { a: 1 } },
    { id: "m2", text: "B", scores: { b: 1 } },
    { id: "m3", text: "AB", scores: { a: 1, b: 1 } },
  ],
}

const quiz: QuizDraft = {
  title: "測試",
  description: "",
  published: true,
  results: [
    { id: "a", title: "A 型", description: "" },
    { id: "b", title: "B 型", description: "" },
  ],
  questions: [single, multiple],
}

describe("isQuestionAnswered", () => {
  it("單選題需剛好選一個", () => {
    expect(isQuestionAnswered(single, [])).toBe(false)
    expect(isQuestionAnswered(single, ["s1"])).toBe(true)
    expect(isQuestionAnswered(single, ["s1", "s2"])).toBe(false)
  })

  it("多選題至少選一個", () => {
    expect(isQuestionAnswered(multiple, undefined)).toBe(false)
    expect(isQuestionAnswered(multiple, ["m1", "m3"])).toBe(true)
  })

  it("不接受不屬於該題的選項", () => {
    expect(isQuestionAnswered(single, ["m1"])).toBe(false)
  })
})

describe("selectOption", () => {
  it("單選題會取代原本的選擇", () => {
    const answers = selectOption({ s: ["s1"] }, single, "s2")
    expect(answers.s).toEqual(["s2"])
  })

  it("多選題可勾選與取消，並保持選項順序", () => {
    let answers = selectOption({}, multiple, "m3")
    answers = selectOption(answers, multiple, "m1")
    expect(answers.m).toEqual(["m1", "m3"])
    answers = selectOption(answers, multiple, "m3", false)
    expect(answers.m).toEqual(["m1"])
  })
})

describe("tallyScores", () => {
  it("加總所選選項的分數，未得分的結果為 0", () => {
    expect(tallyScores(quiz, { s: ["s1"], m: ["m1", "m3"] })).toEqual({ a: 4, b: 1 })
    expect(tallyScores(quiz, {})).toEqual({ a: 0, b: 0 })
  })

  it("忽略指向不存在結果類型的分數", () => {
    const broken: QuizDraft = {
      ...quiz,
      questions: [
        { ...single, options: [{ id: "s1", text: "A", scores: { ghost: 9, a: 1 } }] },
      ],
    }
    expect(tallyScores(broken, { s: ["s1"] })).toEqual({ a: 1, b: 0 })
  })
})

describe("determineResult", () => {
  it("回傳總分最高的結果類型", () => {
    expect(determineResult(quiz, { s: ["s2"], m: ["m2"] }).id).toBe("b")
  })

  it("同分時取排列較前面的結果類型", () => {
    const multipleOnly: QuizDraft = { ...quiz, questions: [multiple] }
    // a:1, b:1 同分 → 取排在前面的 a
    expect(determineResult(multipleOnly, { m: ["m1", "m2"] }).id).toBe("a")
    // 結果類型順序對調後 → 取 b
    const reversed: QuizDraft = { ...multipleOnly, results: [...quiz.results].reverse() }
    expect(determineResult(reversed, { m: ["m1", "m2"] }).id).toBe("b")
  })

  it("未作答完畢時拋出錯誤", () => {
    expect(() => determineResult(quiz, { s: ["s1"] })).toThrow("尚有題目未作答")
    expect(isQuizComplete(quiz, { s: ["s1"] })).toBe(false)
  })

  it("範例測驗每個結果類型都有機會出現", () => {
    const sample = createSampleQuiz()
    const reached = new Set<string>()
    sample.results.forEach((_, index) => {
      const answers = Object.fromEntries(
        sample.questions.map((q) => [q.id, [q.options[index].id]]),
      )
      reached.add(determineResult(sample, answers).id)
    })
    expect(reached.size).toBe(sample.results.length)
  })
})
