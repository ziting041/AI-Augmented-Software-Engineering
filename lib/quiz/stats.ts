import type { ResultType } from "./types"

export interface ResultStat {
  result: ResultType
  count: number
  /** 0～100，四捨五入到整數 */
  percent: number
}

export interface QuizStats {
  total: number
  items: ResultStat[]
}

/** 依結果類型排列順序彙整作答人數；已刪除的結果類型不列入 */
export function summarizeStats(
  results: readonly ResultType[],
  counts: Readonly<Record<string, number>>,
): QuizStats {
  const total = results.reduce((sum, r) => sum + (counts[r.id] ?? 0), 0)
  return {
    total,
    items: results.map((result) => {
      const count = counts[result.id] ?? 0
      return {
        result,
        count,
        percent: total === 0 ? 0 : Math.round((count / total) * 100),
      }
    }),
  }
}
