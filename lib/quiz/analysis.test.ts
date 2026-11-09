import { describe, expect, it } from "vitest"

import { explainResult, rankResults, splitTitle } from "./analysis"
import { buildEmblem, hashString, personaColorIndex } from "./emblem"
import { createSampleQuiz } from "./sample"
import { determineResult } from "./scoring"

const sample = createSampleQuiz()
// 全部選第一個選項（貓頭鷹路線）
const owlAnswers = Object.fromEntries(
  sample.questions.map((q) => [q.id, [q.options[0].id]]),
)

describe("rankResults", () => {
  it("依分數排序，第一名與 determineResult 一致，比例總和為 1", () => {
    const ranked = rankResults(sample, owlAnswers)
    expect(ranked[0].result.id).toBe(determineResult(sample, owlAnswers).id)
    expect(ranked[0].result.id).toBe("owl")
    expect(ranked.reduce((s, r) => s + r.share, 0)).toBeCloseTo(1)
    expect(ranked.map((r) => r.index).sort()).toEqual([0, 1, 2, 3])
  })

  it("同分時依結果類型順序，並保留原始索引", () => {
    const ranked = rankResults(sample, {})
    expect(ranked.map((r) => r.result.id)).toEqual(["owl", "dolphin", "lion", "koala"])
    expect(ranked.every((r) => r.share === 0)).toBe(true)
  })
})

describe("explainResult", () => {
  it("列出對該結果加分最多的作答，分數高者在前", () => {
    const answers = { ...owlAnswers, q3: ["q3a", "q3e"] }
    const evidence = explainResult(sample, answers, "owl")
    expect(evidence).toHaveLength(3)
    expect(evidence[0].points).toBeGreaterThanOrEqual(evidence[2].points)
    expect(evidence.map((e) => e.questionIndex)).toEqual([0, 1, 2])
    expect(evidence[2].options.map((o) => o.id)).toEqual(["q3a", "q3e"])
  })

  it("沒有加分的題目不列入", () => {
    expect(explainResult(sample, owlAnswers, "lion")).toEqual([])
  })
})

describe("splitTitle", () => {
  it("拆出名稱與副標", () => {
    expect(splitTitle("貓頭鷹：冷靜的思考者")).toEqual({ name: "貓頭鷹", tagline: "冷靜的思考者" })
    expect(splitTitle("Owl: thinker")).toEqual({ name: "Owl", tagline: "thinker" })
    expect(splitTitle("甜食派")).toEqual({ name: "甜食派", tagline: null })
  })
})

describe("buildEmblem", () => {
  const shares = rankResults(sample, owlAnswers)
    .sort((a, b) => a.index - b.index)
    .map((r) => r.share)

  it("同樣的輸入產生同樣的徽章", () => {
    const a = buildEmblem({ seed: "x", shares, highlight: 0 })
    const b = buildEmblem({ seed: "x", shares, highlight: 0 })
    expect(a).toEqual(b)
    expect(buildEmblem({ seed: "y", shares, highlight: 0 })).not.toEqual(a)
  })

  it("每個結果類型一片花瓣，得分最高者最長且被標示", () => {
    const emblem = buildEmblem({ seed: "x", shares, highlight: 0 })
    expect(emblem.petals).toHaveLength(4)
    const winner = emblem.petals.find((p) => p.highlight)!
    expect(winner.colorIndex).toBe(1)
    expect(Math.max(...emblem.petals.map((p) => p.length))).toBe(winner.length)
  })

  it("結果類型少於 4 個時重複花瓣", () => {
    expect(buildEmblem({ seed: "x", shares: [0.5, 0.5], highlight: 1 }).petals).toHaveLength(4)
    expect(buildEmblem({ seed: "x", shares: [], highlight: 0 }).petals).toHaveLength(0)
  })

  it("工具函式", () => {
    expect(hashString("abc")).toBe(hashString("abc"))
    expect(personaColorIndex(0)).toBe(1)
    expect(personaColorIndex(6)).toBe(1)
  })
})
