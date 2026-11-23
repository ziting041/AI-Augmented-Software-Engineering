import { describe, expect, it } from "vitest"

import {
  determineResult,
  getAnswerValidationErrors,
  isQuestionAnswered,
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
  category: "測試分類",
  published: true,
  results: [
    { id: "a", title: "A 型", description: "" },
    { id: "b", title: "B 型", description: "" },
  ],
  questions: [single, multiple],
}

describe("isQuestionAnswered", () => {
  it("[AC-4.6] 單選題需剛好選一個才算有效作答", () => {
    expect(isQuestionAnswered(single, [])).toBe(false)
    expect(isQuestionAnswered(single, ["s1"])).toBe(true)
    expect(isQuestionAnswered(single, ["s1", "s2"])).toBe(false)
  })

  it("[AC-4.6] 多選題至少選一個才算有效作答", () => {
    expect(isQuestionAnswered(multiple, undefined)).toBe(false)
    expect(isQuestionAnswered(multiple, ["m1", "m3"])).toBe(true)
  })

})

describe("selectOption", () => {
  it("[AC-4.4] 返回修改單選題時以新答案取代原本的選擇", () => {
    const answers = selectOption({ s: ["s1"] }, single, "s2")
    expect(answers.s).toEqual(["s2"])
  })

  it("[AC-4.4] 返回修改多選題時可勾選與取消，並保持選項順序", () => {
    let answers = selectOption({}, multiple, "m3")
    answers = selectOption(answers, multiple, "m1")
    expect(answers.m).toEqual(["m1", "m3"])
    answers = selectOption(answers, multiple, "m3", false)
    expect(answers.m).toEqual(["m1"])
  })
})

describe("tallyScores", () => {
  it("[AC-4.7] 加總所選選項的分數，未得分的結果為 0", () => {
    expect(tallyScores(quiz, { s: ["s1"], m: ["m1", "m3"] })).toEqual({ a: 4, b: 1 })
    expect(tallyScores(quiz, {})).toEqual({ a: 0, b: 0 })
  })

})

describe("determineResult", () => {
  it("[AC-4.7] 回傳總分最高的結果類型", () => {
    expect(determineResult(quiz, { s: ["s2"], m: ["m2"] }).id).toBe("b")
  })

  it("[AC-4.7] 同分時取排列較前面的結果類型，結果可預期", () => {
    const multipleOnly: QuizDraft = { ...quiz, questions: [multiple] }
    // a:1, b:1 同分 → 取排在前面的 a
    expect(determineResult(multipleOnly, { m: ["m1", "m2"] }).id).toBe("a")
    // 結果類型順序對調後 → 取 b
    const reversed: QuizDraft = { ...multipleOnly, results: [...quiz.results].reverse() }
    expect(determineResult(reversed, { m: ["m1", "m2"] }).id).toBe("b")
  })



})

describe("提交前的答案驗證", () => {
  it("[AC-4.6][AC-5.2] 尚有必答題未完成時不產生結果", () => {
    expect(getAnswerValidationErrors(quiz, { s: ["s1"] })).toContain("尚有題目未作答")
    expect(getAnswerValidationErrors(quiz, { s: ["s1"], m: [] })).toContain("尚有題目未作答")
    expect(() => determineResult(quiz, { s: ["s1"] })).toThrow("尚有題目未作答")
  })

  it("[AC-4.6][AC-5.2] 答案包含不屬於該題的選項時不產生結果", () => {
    const invalid = "答案包含不屬於該題的選項"
    expect(getAnswerValidationErrors(quiz, { s: ["m1"], m: ["m1"] })).toContain(invalid)
    expect(getAnswerValidationErrors(quiz, { s: ["s1", "s2"], m: ["m1"] })).toContain(invalid)
    expect(getAnswerValidationErrors(quiz, { s: ["s1"], m: ["m1", "m1"] })).toContain(invalid)
    expect(getAnswerValidationErrors(quiz, { s: ["s1"], m: ["m1"], ghost: ["x"] })).toContain(
      "答案包含不存在的題目",
    )
    expect(getAnswerValidationErrors(quiz, null)).toEqual(["答案資料無效"])
    expect(() => determineResult(quiz, { s: ["m1"], m: ["m1"] })).toThrow(invalid)
  })

  it("[AC-4.7] 所有必答題均有有效答案時通過驗證並產生結果", () => {
    expect(getAnswerValidationErrors(quiz, { s: ["s2"], m: ["m2"] })).toEqual([])
    expect(determineResult(quiz, { s: ["s2"], m: ["m2"] })).toEqual(quiz.results[1])
  })
})
