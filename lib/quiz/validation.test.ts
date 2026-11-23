import { describe, expect, it } from "vitest"

import { createEmptyQuiz, setOptionScore, updateOptionText, updateQuestion, updateQuizFields, updateResult } from "./editor"
import { createSampleQuiz } from "./sample"
import type { QuizDraft } from "./types"
import { isPlayableQuiz, validateQuiz } from "./validation"

function filledQuiz(): QuizDraft {
  let draft = createEmptyQuiz()
  draft = updateQuizFields(draft, { title: "小測驗", category: "個性探索" })
  draft.results.forEach((r, i) => {
    draft = updateResult(draft, r.id, { title: `結果 ${i + 1}` })
  })
  const q = draft.questions[0]
  draft = updateQuestion(draft, q.id, { text: "題目" })
  q.options.forEach((o, i) => {
    draft = updateOptionText(draft, q.id, o.id, `選項 ${i + 1}`)
    draft = setOptionScore(draft, q.id, o.id, draft.results[i].id, 1)
  })
  return draft
}

describe("validateQuiz", () => {
  it("[AC-1.1] 範例測驗與填寫完整的測驗可通過驗證，可列入目錄", () => {
    expect(validateQuiz(createSampleQuiz())).toEqual([])
    expect(validateQuiz(filledQuiz())).toEqual([])
  })


  it("[AC-1.1][AC-4.5] 只有已發布且內容完整的測驗可作答；沒有題目或題目沒有有效選項時不可作答", () => {
    const sample = createSampleQuiz()
    expect(isPlayableQuiz(sample)).toBe(true)
    expect(isPlayableQuiz({ ...sample, published: false })).toBe(false)
    expect(isPlayableQuiz({ ...sample, questions: [] })).toBe(false)
    expect(isPlayableQuiz({ ...sample, questions: [{ ...sample.questions[0], options: [] }] })).toBe(
      false,
    )
    expect(
      isPlayableQuiz({
        ...sample,
        questions: [
          {
            ...sample.questions[0],
            options: sample.questions[0].options.map((option) => ({ ...option, scores: {} })),
          },
        ],
      }),
    ).toBe(false)
    expect(isPlayableQuiz(null)).toBe(false)
  })

  it("[AC-4.5] 沒有題目或結果類型不足的測驗不通過驗證", () => {
    const draft = { ...filledQuiz(), results: [filledQuiz().results[0]], questions: [] }
    const errors = validateQuiz(draft)
    expect(errors).toContain("至少需要 2 個結果類型")
    expect(errors).toContain("至少需要 1 道題目")
  })


})
