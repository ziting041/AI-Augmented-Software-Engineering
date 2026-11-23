import { describe, expect, it } from "vitest"

import { explainResult, rankResults, splitTitle } from "./analysis"
import { createSampleQuiz } from "./sample"
import { determineResult } from "./scoring"

const sample = createSampleQuiz()
// 全部選第一個選項（貓頭鷹路線）
const owlAnswers = Object.fromEntries(
  sample.questions.map((q) => [q.id, [q.options[0].id]]),
)

describe("rankResults", () => {
  it("[AC-5.1] 結果依據：依分數排序，第一名與實際結果一致，比例總和為 1", () => {
    const ranked = rankResults(sample, owlAnswers)
    expect(ranked[0].result.id).toBe(determineResult(sample, owlAnswers).id)
    expect(ranked[0].result.id).toBe("owl")
    expect(ranked.reduce((s, r) => s + r.share, 0)).toBeCloseTo(1)
    expect(ranked.map((r) => r.index).sort()).toEqual([0, 1, 2, 3])
  })

  it("[AC-5.1] 結果依據：同分時依結果類型順序，並保留原始索引", () => {
    const ranked = rankResults(sample, {})
    expect(ranked.map((r) => r.result.id)).toEqual(["owl", "dolphin", "lion", "koala"])
    expect(ranked.every((r) => r.share === 0)).toBe(true)
  })
})

describe("explainResult", () => {
  it("[AC-5.1] 回答依據：列出對該結果加分最多的作答，分數高者在前", () => {
    const answers = { ...owlAnswers, q3: ["q3a", "q3e"] }
    const evidence = explainResult(sample, answers, "owl")
    expect(evidence).toHaveLength(3)
    expect(evidence[0].points).toBeGreaterThanOrEqual(evidence[2].points)
    expect(evidence.map((e) => e.questionIndex)).toEqual([0, 1, 2])
    expect(evidence[2].options.map((o) => o.id)).toEqual(["q3a", "q3e"])
  })

  it("[AC-5.1] 回答依據：沒有加分的題目不列入", () => {
    expect(explainResult(sample, owlAnswers, "lion")).toEqual([])
  })
})

describe("splitTitle", () => {
  it("[AC-5.1] 結果說明：拆出名稱與副標", () => {
    expect(splitTitle("貓頭鷹：冷靜的思考者")).toEqual({ name: "貓頭鷹", tagline: "冷靜的思考者" })
    expect(splitTitle("Owl: thinker")).toEqual({ name: "Owl", tagline: "thinker" })
    expect(splitTitle("甜食派")).toEqual({ name: "甜食派", tagline: null })
  })
})
