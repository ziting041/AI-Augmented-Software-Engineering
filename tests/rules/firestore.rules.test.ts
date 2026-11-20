// Firestore 安全規則測試（US-7）。需在 Firestore 模擬器中執行：npm run test:rules
// 規則檔直接讀取專案根目錄的 firestore.rules，與部署的內容相同。
import { readFileSync } from "node:fs"

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore"
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest"

const ADMIN_UID = "admin-uid"
const USER_UID = "plain-user-uid"

let env: RulesTestEnvironment

/** 格式正確、可通過 isValidQuiz 的測驗內容（不含時間戳） */
function quizBody(overrides: Record<string, unknown> = {}) {
  return {
    title: "規則測試用測驗",
    description: "",
    category: "測試",
    published: true,
    results: [
      { id: "a", title: "A", description: "" },
      { id: "b", title: "B", description: "" },
    ],
    resultIds: ["a", "b"],
    questions: [
      {
        id: "q1",
        text: "題目",
        type: "single",
        options: [
          { id: "o1", text: "選項 1", scores: { a: 1 } },
          { id: "o2", text: "選項 2", scores: { b: 1 } },
        ],
      },
    ],
    ...overrides,
  }
}

const anonymous = (): Firestore => env.unauthenticatedContext().firestore() as unknown as Firestore
const plainUser = (): Firestore => env.authenticatedContext(USER_UID).firestore() as unknown as Firestore
const admin = (): Firestore => env.authenticatedContext(ADMIN_UID).firestore() as unknown as Firestore

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-quiz-rules",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  })
})

afterAll(async () => {
  await env?.cleanup()
})

// 每個測試前重設資料：一位管理員、一份已發布測驗、一份草稿、一筆作答紀錄
beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore() as unknown as Firestore
    const now = Timestamp.now()
    await setDoc(doc(db, "admins", ADMIN_UID), { email: "admin@example.com" })
    await setDoc(doc(db, "quizzes", "published"), { ...quizBody(), createdAt: now, updatedAt: now })
    await setDoc(doc(db, "quizzes", "draft"), {
      ...quizBody({ published: false }),
      createdAt: now,
      updatedAt: now,
    })
    await setDoc(doc(db, "submissions", "existing"), {
      quizId: "published",
      resultId: "a",
      createdAt: now,
    })
  })
})

describe("測驗讀取", () => {
  it("[AC-7.1] 未登入者可讀已發布測驗，也可用 published 條件列表", async () => {
    await assertSucceeds(getDoc(doc(anonymous(), "quizzes", "published")))
    await assertSucceeds(
      getDocs(query(collection(anonymous(), "quizzes"), where("published", "==", true))),
    )
  })

  it("[AC-7.1] 未登入者讀草稿或不帶條件列表都被拒，管理員可讀草稿", async () => {
    await assertFails(getDoc(doc(anonymous(), "quizzes", "draft")))
    await assertFails(getDocs(collection(anonymous(), "quizzes")))
    await assertSucceeds(getDoc(doc(admin(), "quizzes", "draft")))
  })
})

describe("測驗寫入", () => {
  const newQuiz = () => ({
    ...quizBody(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  it("[AC-7.2] 未登入者不能新增、修改、刪除測驗", async () => {
    await assertFails(setDoc(doc(anonymous(), "quizzes", "new"), newQuiz()))
    await assertFails(
      updateDoc(doc(anonymous(), "quizzes", "published"), { title: "改掉", updatedAt: serverTimestamp() }),
    )
    await assertFails(deleteDoc(doc(anonymous(), "quizzes", "published")))
  })

  it("[AC-7.2] 已登入但不在管理員名單的使用者不能新增、修改、刪除測驗", async () => {
    await assertFails(setDoc(doc(plainUser(), "quizzes", "new"), newQuiz()))
    await assertFails(
      updateDoc(doc(plainUser(), "quizzes", "published"), { title: "改掉", updatedAt: serverTimestamp() }),
    )
    await assertFails(deleteDoc(doc(plainUser(), "quizzes", "published")))
  })

  it("[AC-7.3] 管理員可新增、修改、刪除格式正確的測驗", async () => {
    await assertSucceeds(setDoc(doc(admin(), "quizzes", "new"), newQuiz()))
    await assertSucceeds(
      updateDoc(doc(admin(), "quizzes", "published"), { title: "新標題", updatedAt: serverTimestamp() }),
    )
    await assertSucceeds(deleteDoc(doc(admin(), "quizzes", "draft")))
  })

  it("[AC-7.3] 管理員送出缺欄位、多欄位或非伺服器時間戳的測驗被拒", async () => {
    const { category: _omitted, ...withoutCategory } = newQuiz()
    void _omitted
    await assertFails(setDoc(doc(admin(), "quizzes", "no-category"), withoutCategory))
    await assertFails(setDoc(doc(admin(), "quizzes", "extra"), { ...newQuiz(), hacked: true }))
    await assertFails(
      setDoc(doc(admin(), "quizzes", "client-time"), { ...newQuiz(), createdAt: Timestamp.now() }),
    )
    await assertFails(
      setDoc(doc(admin(), "quizzes", "one-result"), {
        ...newQuiz(),
        results: [{ id: "a", title: "A", description: "" }],
        resultIds: ["a"],
      }),
    )
    // 修改時不可竄改建立時間
    await assertFails(
      updateDoc(doc(admin(), "quizzes", "published"), {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    )
  })
})

describe("匿名作答紀錄", () => {
  it("[AC-7.4] 未登入者可新增指向已發布測驗既有結果的作答", async () => {
    await assertSucceeds(
      addDoc(collection(anonymous(), "submissions"), {
        quizId: "published",
        resultId: "b",
        createdAt: serverTimestamp(),
      }),
    )
  })

  it("[AC-7.4] 指向草稿、不存在的測驗或結果、含多餘欄位或客戶端時間的作答被拒", async () => {
    const submit = (data: Record<string, unknown>) =>
      addDoc(collection(anonymous(), "submissions"), { createdAt: serverTimestamp(), ...data })
    await assertFails(submit({ quizId: "draft", resultId: "a" }))
    await assertFails(submit({ quizId: "missing", resultId: "a" }))
    await assertFails(submit({ quizId: "published", resultId: "not-a-result" }))
    await assertFails(submit({ quizId: "published", resultId: "a", userAgent: "x" }))
    await assertFails(submit({ quizId: "published", resultId: "a", createdAt: Timestamp.now() }))
  })

  it("[AC-7.5] 只有管理員能讀取作答紀錄", async () => {
    await assertFails(getDoc(doc(anonymous(), "submissions", "existing")))
    await assertFails(getDoc(doc(plainUser(), "submissions", "existing")))
    await assertSucceeds(getDoc(doc(admin(), "submissions", "existing")))
    await assertSucceeds(
      getDocs(query(collection(admin(), "submissions"), where("quizId", "==", "published"))),
    )
  })

  it("[AC-7.5] 任何人（含管理員）都不能修改或刪除作答紀錄", async () => {
    for (const db of [anonymous(), plainUser(), admin()]) {
      await assertFails(updateDoc(doc(db, "submissions", "existing"), { resultId: "b" }))
      await assertFails(deleteDoc(doc(db, "submissions", "existing")))
    }
  })
})

describe("管理員名單", () => {
  it("[AC-7.6] 本人可讀自己的文件，不能讀他人或列出名單", async () => {
    await assertSucceeds(getDoc(doc(admin(), "admins", ADMIN_UID)))
    await assertFails(getDoc(doc(plainUser(), "admins", ADMIN_UID)))
    await assertFails(getDocs(collection(admin(), "admins")))
  })

  it("[AC-7.6] 任何人都不能把自己加入或移出管理員名單", async () => {
    await assertFails(setDoc(doc(plainUser(), "admins", USER_UID), {}))
    await assertFails(setDoc(doc(anonymous(), "admins", "someone"), {}))
    await assertFails(deleteDoc(doc(admin(), "admins", ADMIN_UID)))
  })
})
