import { describe, expect, it } from "vitest"

import {
  addOption,
  addQuestion,
  addResult,
  createEmptyQuiz,
  moveQuestion,
  removeOption,
  removeQuestion,
  removeResult,
  setOptionScore,
  toDraft,
  updateQuestion,
} from "./editor"

describe("測驗編輯器", () => {
  it("建立的空白測驗包含 2 個結果類型與 1 道題目", () => {
    const draft = createEmptyQuiz()
    expect(draft.results).toHaveLength(2)
    expect(draft.questions).toHaveLength(1)
    expect(draft.questions[0].options).toHaveLength(2)
    expect(draft.published).toBe(false)
  })

  it("不會修改原本的物件", () => {
    const draft = createEmptyQuiz()
    const snapshot = structuredClone(draft)
    addQuestion(draft)
    addResult(draft)
    setOptionScore(draft, draft.questions[0].id, draft.questions[0].options[0].id, draft.results[0].id, 3)
    expect(draft).toEqual(snapshot)
  })

  it("可新增、刪除題目與選項", () => {
    let draft = addQuestion(createEmptyQuiz())
    expect(draft.questions).toHaveLength(2)
    const q = draft.questions[1]
    draft = addOption(draft, q.id)
    expect(draft.questions[1].options).toHaveLength(3)
    draft = removeOption(draft, q.id, draft.questions[1].options[0].id)
    expect(draft.questions[1].options).toHaveLength(2)
    draft = removeQuestion(draft, q.id)
    expect(draft.questions).toHaveLength(1)
  })

  it("可切換題型與調整題目順序", () => {
    let draft = addQuestion(createEmptyQuiz())
    const [first, second] = draft.questions
    draft = updateQuestion(draft, second.id, { type: "multiple" })
    draft = moveQuestion(draft, second.id, -1)
    expect(draft.questions.map((q) => q.id)).toEqual([second.id, first.id])
    expect(draft.questions[0].type).toBe("multiple")
    // 超出範圍時不變
    expect(moveQuestion(draft, second.id, -1)).toBe(draft)
  })

  it("分數設為 0 時從 scores 移除", () => {
    let draft = createEmptyQuiz()
    const q = draft.questions[0]
    const o = q.options[0]
    const r = draft.results[0]
    draft = setOptionScore(draft, q.id, o.id, r.id, 3)
    expect(draft.questions[0].options[0].scores).toEqual({ [r.id]: 3 })
    draft = setOptionScore(draft, q.id, o.id, r.id, 0)
    expect(draft.questions[0].options[0].scores).toEqual({})
  })

  it("刪除結果類型時一併清除相關分數", () => {
    let draft = createEmptyQuiz()
    const q = draft.questions[0]
    const [r1, r2] = draft.results
    draft = setOptionScore(draft, q.id, q.options[0].id, r1.id, 2)
    draft = setOptionScore(draft, q.id, q.options[0].id, r2.id, 1)
    draft = removeResult(draft, r1.id)
    expect(draft.results.map((r) => r.id)).toEqual([r2.id])
    expect(draft.questions[0].options[0].scores).toEqual({ [r2.id]: 1 })
  })

  it("toDraft 只保留可編輯欄位", () => {
    const draft = createEmptyQuiz()
    const quiz = { ...draft, id: "x", createdAt: 1, updatedAt: 2 }
    expect(toDraft(quiz)).toEqual(draft)
  })
})
