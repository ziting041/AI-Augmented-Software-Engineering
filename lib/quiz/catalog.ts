import type { Quiz } from "./types"

export interface QuizFilters {
  search: string
  category: string
}

export function listQuizCategories(quizzes: readonly Quiz[]): string[] {
  return [...new Set(quizzes.map((quiz) => quiz.category.trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "zh-TW"),
  )
}

export function filterQuizzes(
  quizzes: readonly Quiz[],
  filters: QuizFilters,
): Quiz[] {
  const search = filters.search.trim().toLocaleLowerCase("zh-TW")

  return quizzes.filter((quiz) => {
    if (filters.category && quiz.category.trim() !== filters.category) return false
    if (!search) return true

    return [quiz.title, quiz.description, quiz.category].some((value) =>
      value.toLocaleLowerCase("zh-TW").includes(search),
    )
  })
}
