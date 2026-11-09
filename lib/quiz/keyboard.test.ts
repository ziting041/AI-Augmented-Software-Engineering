import { describe, expect, it } from "vitest"

import { optionIndexFromKey, optionMarker } from "./keyboard"

describe("鍵盤快捷鍵", () => {
  it("字母標記", () => {
    expect([0, 1, 25].map(optionMarker)).toEqual(["A", "B", "Z"])
  })

  it("數字與字母都能選取選項", () => {
    expect(optionIndexFromKey("1", 4)).toBe(0)
    expect(optionIndexFromKey("4", 4)).toBe(3)
    expect(optionIndexFromKey("b", 4)).toBe(1)
    expect(optionIndexFromKey("D", 4)).toBe(3)
  })

  it("超出範圍或非快捷鍵回傳 null", () => {
    expect(optionIndexFromKey("5", 4)).toBeNull()
    expect(optionIndexFromKey("e", 4)).toBeNull()
    expect(optionIndexFromKey("0", 4)).toBeNull()
    expect(optionIndexFromKey("Enter", 4)).toBeNull()
  })
})
