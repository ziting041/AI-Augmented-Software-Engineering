import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createSampleQuiz } from "@/lib/quiz/sample"
import {
  createLocalRepositories,
  LOCAL_DEMO_ADMIN,
  LOCAL_SESSION_TTL_MS,
  parseLocalSession,
} from "./local"

/** 以 Map 模擬瀏覽器的 localStorage */
function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  }
}

const SESSION_KEY = "quiz-site:session"
const QUIZZES_KEY = "quiz-site:quizzes"

beforeEach(() => {
  vi.stubGlobal("localStorage", memoryStorage())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const repos = createLocalRepositories()

describe("parseLocalSession", () => {
  it("[AC-6.4] 登入逾期或格式不符時視為未登入", () => {
    const now = 1_000_000
    expect(parseLocalSession({ email: LOCAL_DEMO_ADMIN.email, expiresAt: now + 1 }, now)).not.toBeNull()
    expect(parseLocalSession({ email: LOCAL_DEMO_ADMIN.email, expiresAt: now }, now)).toBeNull()
    expect(parseLocalSession({ email: LOCAL_DEMO_ADMIN.email, expiresAt: now - 1 }, now)).toBeNull()
    expect(parseLocalSession({ email: "someone@example.com", expiresAt: now + 1 }, now)).toBeNull()
    // 舊版只存 email 字串的登入資料沒有期限，一律要求重新登入
    expect(parseLocalSession(LOCAL_DEMO_ADMIN.email, now)).toBeNull()
    expect(parseLocalSession(null, now)).toBeNull()
  })
})

describe("本機管理資料操作", () => {
  it("[AC-6.1] 未登入時呼叫管理資料操作被拒，且不回傳或變更資料", async () => {
    await repos.quizzes.listPublished() // 放入預設範例測驗
    const before = localStorage.getItem(QUIZZES_KEY)

    await expect(repos.quizzes.listAll()).rejects.toThrow("權限不足")
    await expect(repos.quizzes.create(createSampleQuiz())).rejects.toThrow("權限不足")
    await expect(repos.quizzes.update("sample", createSampleQuiz())).rejects.toThrow("權限不足")
    await expect(repos.quizzes.remove("sample")).rejects.toThrow("權限不足")
    await expect(repos.submissions.countByResult("sample", ["owl"])).rejects.toThrow("權限不足")
    expect(localStorage.getItem(QUIZZES_KEY)).toBe(before)
  })

  it("[AC-6.4] 登入逾期後管理資料操作立即被拒，且不變更資料", async () => {
    await repos.auth.signIn(LOCAL_DEMO_ADMIN.email, LOCAL_DEMO_ADMIN.password)
    await expect(repos.quizzes.listAll()).resolves.toHaveLength(1)
    const before = localStorage.getItem(QUIZZES_KEY)

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ email: LOCAL_DEMO_ADMIN.email, expiresAt: Date.now() - 1 }),
    )
    await expect(repos.quizzes.listAll()).rejects.toThrow("權限不足")
    await expect(repos.quizzes.remove("sample")).rejects.toThrow("權限不足")
    expect(localStorage.getItem(QUIZZES_KEY)).toBe(before)
  })

  it("[AC-6.5] 管理員登入後可使用管理資料操作，登入有效期限為 8 小時", async () => {
    const start = Date.now()
    await repos.auth.signIn(LOCAL_DEMO_ADMIN.email, LOCAL_DEMO_ADMIN.password)
    const session = JSON.parse(localStorage.getItem(SESSION_KEY)!)
    expect(session.expiresAt).toBeGreaterThanOrEqual(start + LOCAL_SESSION_TTL_MS)

    const id = await repos.quizzes.create(createSampleQuiz())
    const all = await repos.quizzes.listAll()
    expect(all.map((q) => q.id)).toContain(id)
  })

  it("[AC-6.1] 帳號或密碼錯誤時不會登入", async () => {
    await expect(repos.auth.signIn(LOCAL_DEMO_ADMIN.email, "wrong")).rejects.toThrow("帳號或密碼錯誤")
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
    await expect(repos.quizzes.listAll()).rejects.toThrow("權限不足")
  })
})
