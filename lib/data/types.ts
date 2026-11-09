import type { Quiz, QuizDraft } from "@/lib/quiz/types"

export interface QuizRepository {
  /** 所有已發布的測驗（任何人可讀） */
  listPublished(): Promise<Quiz[]>
  /** 所有測驗，含草稿（僅管理員） */
  listAll(): Promise<Quiz[]>
  /** 找不到或無權限讀取時回傳 null */
  get(id: string): Promise<Quiz | null>
  create(draft: QuizDraft): Promise<string>
  update(id: string, draft: QuizDraft): Promise<void>
  remove(id: string): Promise<void>
}

export interface SubmissionRepository {
  /** 匿名記錄一次作答結果 */
  submit(quizId: string, resultId: string): Promise<void>
  /** 各結果類型的作答次數（僅管理員） */
  countByResult(quizId: string, resultIds: string[]): Promise<Record<string, number>>
}

export type AdminSession =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; email: string; isAdmin: boolean }

export interface AuthService {
  /** 訂閱登入狀態，回傳取消訂閱函式 */
  subscribe(listener: (session: AdminSession) => void): () => void
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
}

export interface Repositories {
  backend: "firebase" | "local"
  quizzes: QuizRepository
  submissions: SubmissionRepository
  auth: AuthService
}

/** 給使用者看的錯誤；message 為繁體中文 */
export class DataError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = "DataError"
  }
}

export function toUserMessage(error: unknown, fallback = "發生錯誤，請稍後再試"): string {
  return error instanceof DataError ? error.message : fallback
}
