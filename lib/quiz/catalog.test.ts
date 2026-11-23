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
  it("[AC-3.2] 空白搜尋視為未設定，並保留分類篩選", () => {
    expect(filterQuizzes(quizzes, { search: "   ", category: "生活風格" })).toEqual([
      quizzes[1],
    ])
  })

  it("[AC-3.3] 分類比較時忽略資料前後空白", () => {
    expect(
      filterQuizzes(
        [{ ...quizzes[0], category: " 個性探索 " }],
        { search: "", category: "個性探索" },
      ),
    ).toHaveLength(1)
  })

  it("[AC-3.3] 可依標題、說明搜尋並精確套用分類", () => {
    expect(filterQuizzes(quizzes, { search: "早餐", category: "" })).toEqual([quizzes[1]])
    expect(filterQuizzes(quizzes, { search: "森林", category: "生活風格" })).toEqual([])
  })

  it("[AC-3.4] 不存在的分類值不回傳其他測驗", () => {
    expect(filterQuizzes(quizzes, { search: "", category: "不存在的分類" })).toEqual([])
    expect(filterQuizzes(quizzes, { search: "早餐", category: "不存在的分類" })).toEqual([])
  })

  it("[AC-3.5] 關鍵字沒有符合項目時回傳空清單", () => {
    expect(filterQuizzes(quizzes, { search: "不存在的測驗", category: "" })).toEqual([])
  })

  it("[AC-3.1] 分類選單去重並依繁體中文排序", () => {
    expect(listQuizCategories([...quizzes, quizzes[0]])).toEqual(["生活風格", "個性探索"])
  })
})
