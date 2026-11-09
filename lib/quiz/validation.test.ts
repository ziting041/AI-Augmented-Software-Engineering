import { describe, expect, it } from "vitest"

import { createEmptyQuiz, setOptionScore, updateOptionText, updateQuestion, updateQuizFields, updateResult } from "./editor"
import { createSampleQuiz } from "./sample"
import type { QuizDraft } from "./types"
import { validateQuiz } from "./validation"

function filledQuiz(): QuizDraft {
  let draft = createEmptyQuiz()
  draft = updateQuizFields(draft, { title: "小測驗" })
  draft.results.forEach((r, i) => {
    draft = updateResult(draft, r.id, { title: `結果 ${i + 1}` })
  })
  const q = draft.questions[0]
  draft = updateQuestion(draft, q.id, { text: "題目" })
  q.options.forEach((o, i) => {
    draft = updateOptionText(draft, q.id, o.id, `選項 ${i + 1}`)
  })
  return draft
}

describe("validateQuiz", () => {
  it("範例測驗與填寫完整的測驗可通過驗證", () => {
    expect(validateQuiz(createSampleQuiz())).toEqual([])
    expect(validateQuiz(filledQuiz())).toEqual([])
  })

  it("空白測驗會列出必填欄位", () => {
    const errors = validateQuiz(createEmptyQuiz())
    expect(errors).toContain("請輸入測驗標題")
    expect(errors).toContain("結果類型 1：請輸入名稱")
    expect(errors).toContain("第 1 題：請輸入題目內容")
    expect(errors).toContain("第 1 題選項 1：請輸入選項內容")
  })

  it("結果類型至少 2 個、題目至少 1 道", () => {
    const draft = { ...filledQuiz(), results: [filledQuiz().results[0]], questions: [] }
    const errors = validateQuiz(draft)
    expect(errors).toContain("至少需要 2 個結果類型")
    expect(errors).toContain("至少需要 1 道題目")
  })

  it("分數必須是 0～10 的整數", () => {
    let draft = filledQuiz()
    const q = draft.questions[0]
    draft = setOptionScore(draft, q.id, q.options[0].id, draft.results[0].id, 11)
    draft = setOptionScore(draft, q.id, q.options[1].id, draft.results[0].id, 1.5)
    const errors = validateQuiz(draft)
    expect(errors).toContain("第 1 題選項 1：分數須為 0～10 的整數")
    expect(errors).toContain("第 1 題選項 2：分數須為 0～10 的整數")
  })

  it("偵測分數指向不存在的結果類型", () => {
    const draft = filledQuiz()
    draft.questions[0].options[0].scores = { ghost: 1 }
    expect(validateQuiz(draft)).toContain(
      "第 1 題選項 1：分數對應到不存在的結果類型",
    )
  })
})
