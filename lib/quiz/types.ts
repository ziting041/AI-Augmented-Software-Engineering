// 心理測驗領域模型
// 計分方式：每個選項對各「結果類型」加分，作答完畢後總分最高的結果類型即為測驗結果。

export type QuestionType = "single" | "multiple"

export interface ResultType {
  id: string
  title: string
  description: string
}

export interface Option {
  id: string
  text: string
  /** key 為 ResultType.id，value 為選擇此選項時加的分數 */
  scores: Record<string, number>
}

export interface Question {
  id: string
  text: string
  type: QuestionType
  options: Option[]
}

/** 尚未存檔（或編輯中）的測驗內容 */
export interface QuizDraft {
  title: string
  description: string
  published: boolean
  results: ResultType[]
  questions: Question[]
}

export interface Quiz extends QuizDraft {
  id: string
  /** 毫秒時間戳；剛建立、伺服器時間尚未回填時可能為 null */
  createdAt: number | null
  updatedAt: number | null
}

/** key 為 Question.id，value 為所選的 Option.id */
export type Answers = Record<string, string[]>
