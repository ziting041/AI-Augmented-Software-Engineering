import { describe, expect, it } from "vitest"

import { filterQuizzes, listQuizCategories } from "./catalog"
import { createSampleQuiz } from "./sample"
import type { Quiz } from "./types"

const sample = createSampleQuiz()
const quizzes: Quiz[] = [
  { ...sample, id: "forest", createdAt: 1, updatedAt: 1 },
  {
    ...sample,
    id: "food",
    title: "早餐選擇",
    description: "從早餐看個性",
    category: "生活風格",
    createdAt: 2,
    updatedAt: 2,
  },
]

describe("quiz catalog filters", () => {
  it("[AC-1.3] 空白搜尋視為未設定，並保留分類篩選", () => {
    expect(filterQuizzes(quizzes, { search: "   ", category: "生活風格" })).toEqual([
      quizzes[1],
    ])
  })

  it("[AC-1.3] 分類比較時忽略資料前後空白", () => {
    expect(
      filterQuizzes(
        [{ ...quizzes[0], category: " 個性探索 " }],
        { search: "", category: "個性探索" },
      ),
    ).toHaveLength(1)
  })

  it("[AC-1.3] 可依標題、說明搜尋並精確套用分類", () => {
    expect(filterQuizzes(quizzes, { search: "早餐", category: "" })).toEqual([quizzes[1]])
    expect(filterQuizzes(quizzes, { search: "森林", category: "生活風格" })).toEqual([])
  })

  it("[AC-1.3] 未知分類與無符合項目都不回傳其他測驗", () => {
    expect(filterQuizzes(quizzes, { search: "", category: "不存在的分類" })).toEqual([])
    expect(filterQuizzes(quizzes, { search: "不存在的測驗", category: "" })).toEqual([])
  })

  it("[AC-1.1] 分類去重並依繁體中文排序", () => {
    expect(listQuizCategories([...quizzes, quizzes[0]])).toEqual(["生活風格", "個性探索"])
  })
})
