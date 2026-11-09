import { describe, expect, it } from "vitest"

import { summarizeStats } from "./stats"

const results = [
  { id: "a", title: "A", description: "" },
  { id: "b", title: "B", description: "" },
  { id: "c", title: "C", description: "" },
]

describe("summarizeStats", () => {
  it("計算人數與百分比", () => {
    const stats = summarizeStats(results, { a: 1, b: 2, c: 0 })
    expect(stats.total).toBe(3)
    expect(stats.items.map((i) => [i.result.id, i.count, i.percent])).toEqual([
      ["a", 1, 33],
      ["b", 2, 67],
      ["c", 0, 0],
    ])
  })

  it("沒有作答時百分比為 0", () => {
    const stats = summarizeStats(results, {})
    expect(stats.total).toBe(0)
    expect(stats.items.every((i) => i.percent === 0)).toBe(true)
  })

  it("忽略已刪除結果類型的人數", () => {
    expect(summarizeStats(results, { a: 1, deleted: 5 }).total).toBe(1)
  })
})
