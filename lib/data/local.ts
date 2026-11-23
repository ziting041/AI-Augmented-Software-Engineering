// localStorage 實作：僅供 E2E 測試與離線展示（NEXT_PUBLIC_DATA_BACKEND=local）。
// 資料只存在目前的瀏覽器，示範管理員帳號也只在本機模式有效，不具任何安全性。
import { createId } from "@/lib/quiz/editor"
import { createSampleQuiz } from "@/lib/quiz/sample"
import type { Quiz, QuizDraft } from "@/lib/quiz/types"
import { isPlayableQuiz } from "@/lib/quiz/validation"
import { sortByUpdatedDesc } from "./serialize"
import {
  DataError,
  type AdminSession,
  type AuthService,
  type QuizRepository,
  type Repositories,
  type SubmissionRepository,
} from "./types"

export const LOCAL_DEMO_ADMIN = {
  email: "admin@example.com",
  password: "admin1234",
} as const

const KEYS = {
  quizzes: "quiz-site:quizzes",
  submissions: "quiz-site:submissions",
  session: "quiz-site:session",
} as const

interface StoredSubmission {
  quizId: string
  resultId: string
  createdAt: number
}

function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new DataError("本機資料格式錯誤，請清除資料後重試", { cause: error })
    }
    throw error
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

/** 第一次使用時放入範例測驗 */
function loadQuizzes(): Quiz[] {
  if (localStorage.getItem(KEYS.quizzes) === null) {
    const now = Date.now()
    write(KEYS.quizzes, [
      { ...createSampleQuiz(), id: "sample", createdAt: now, updatedAt: now },
    ])
  }
  return read<Quiz[]>(KEYS.quizzes, []).map((quiz) => ({
    ...quiz,
    category: typeof quiz.category === "string" ? quiz.category : "未分類",
  }))
}

function getSessionEmail(): string | null {
  const email = read<string | null>(KEYS.session, null)
  return typeof email === "string" && email.length > 0 ? email : null
}

function isAdmin(): boolean {
  return getSessionEmail() === LOCAL_DEMO_ADMIN.email
}

function requireAdmin(): void {
  if (!isAdmin()) throw new DataError("權限不足：請確認你已用管理員帳號登入")
}

const quizzes: QuizRepository = {
  async listPublished() {
    return sortByUpdatedDesc(loadQuizzes().filter(isPlayableQuiz))
  },
  async listAll() {
    requireAdmin()
    return sortByUpdatedDesc(loadQuizzes())
  },
  async get(id) {
    const quiz = loadQuizzes().find((q) => q.id === id)
    if (!quiz) return null
    return quiz.published || isAdmin() ? quiz : null
  },
  async create(draft: QuizDraft) {
    requireAdmin()
    const now = Date.now()
    const id = createId()
    write(KEYS.quizzes, [
      ...loadQuizzes(),
      { ...draft, category: draft.category.trim(), id, createdAt: now, updatedAt: now },
    ])
    return id
  },
  async update(id, draft) {
    requireAdmin()
    const all = loadQuizzes()
    if (!all.some((q) => q.id === id)) throw new DataError("找不到這份測驗")
    write(
      KEYS.quizzes,
      all.map((q) =>
        q.id === id
          ? { ...q, ...draft, category: draft.category.trim(), updatedAt: Date.now() }
          : q,
      ),
    )
  },
  async remove(id) {
    requireAdmin()
    write(KEYS.quizzes, loadQuizzes().filter((q) => q.id !== id))
  },
}

const submissions: SubmissionRepository = {
  async submit(quizId, resultId) {
    const list = read<StoredSubmission[]>(KEYS.submissions, [])
    write(KEYS.submissions, [...list, { quizId, resultId, createdAt: Date.now() }])
  },
  async countByResult(quizId, resultIds) {
    requireAdmin()
    const counts: Record<string, number> = Object.fromEntries(
      resultIds.map((id) => [id, 0]),
    )
    for (const s of read<StoredSubmission[]>(KEYS.submissions, [])) {
      if (s.quizId === quizId && s.resultId in counts) counts[s.resultId] += 1
    }
    return counts
  },
}

const listeners = new Set<(session: AdminSession) => void>()

function currentSession(): AdminSession {
  const email = getSessionEmail()
  return email
    ? { status: "signed-in", email, isAdmin: email === LOCAL_DEMO_ADMIN.email }
    : { status: "signed-out" }
}

function notify(): void {
  const session = currentSession()
  listeners.forEach((l) => l(session))
}

const authService: AuthService = {
  subscribe(listener) {
    listeners.add(listener)
    listener(currentSession())
    return () => listeners.delete(listener)
  },
  async signIn(email, password) {
    if (email !== LOCAL_DEMO_ADMIN.email || password !== LOCAL_DEMO_ADMIN.password) {
      throw new DataError("帳號或密碼錯誤")
    }
    write(KEYS.session, email)
    notify()
  },
  async signOut() {
    localStorage.removeItem(KEYS.session)
    notify()
  },
}

export function createLocalRepositories(): Repositories {
  return { backend: "local", quizzes, submissions, auth: authService }
}
