// 結果頁使用的分析：全部由作答資料計算，不依賴 AI。
import { tallyScores } from "./scoring"
import type { Answers, Option, Question, QuizDraft, ResultType } from "./types"

export interface ResultScore {
  result: ResultType
  /** 在測驗中的排列順序（0 起算），用於配色 */
  index: number
  score: number
  /** 佔所有得分的比例（0～1） */
  share: number
}

/** 依分數由高到低排序；同分維持結果類型的排列順序（與 determineResult 一致） */
export function rankResults(quiz: QuizDraft, answers: Answers): ResultScore[] {
  const totals = tallyScores(quiz, answers)
  const sum = Object.values(totals).reduce((a, b) => a + b, 0)
  return quiz.results
    .map((result, index) => ({
      result,
      index,
      score: totals[result.id] ?? 0,
      share: sum === 0 ? 0 : (totals[result.id] ?? 0) / sum,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
}

export interface Evidence {
  question: Question
  questionIndex: number
  /** 使用者在這題選的選項中，對該結果有加分者 */
  options: Option[]
  points: number
}

/** 找出對指定結果加分最多的幾題作答，作為「為什麼是這個結果」的依據 */
export function explainResult(
  quiz: QuizDraft,
  answers: Answers,
  resultId: string,
  limit = 3,
): Evidence[] {
  const evidence: Evidence[] = []
  quiz.questions.forEach((question, questionIndex) => {
    const selected = new Set(answers[question.id] ?? [])
    const options = question.options.filter(
      (o) => selected.has(o.id) && (o.scores[resultId] ?? 0) > 0,
    )
    const points = options.reduce((sum, o) => sum + (o.scores[resultId] ?? 0), 0)
    if (points > 0) evidence.push({ question, questionIndex, options, points })
  })
  return evidence
    .sort((a, b) => b.points - a.points || a.questionIndex - b.questionIndex)
    .slice(0, limit)
}

/** 把「貓頭鷹：冷靜的思考者」拆成名稱與副標，沒有分隔符號時副標為 null */
export function splitTitle(title: string): { name: string; tagline: string | null } {
  const match = title.match(/^(.+?)\s*[：:｜|—]\s*(.+)$/)
  return match ? { name: match[1], tagline: match[2] } : { name: title, tagline: null }
}
