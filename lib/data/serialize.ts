import type { Quiz } from "@/lib/quiz/types"

/** 最近更新的排前面；尚無時間戳（剛建立）的視為最新 */
export function sortByUpdatedDesc(quizzes: Quiz[]): Quiz[] {
  return [...quizzes].sort(
    (a, b) => (b.updatedAt ?? Infinity) - (a.updatedAt ?? Infinity),
  )
}
