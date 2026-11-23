import { readFileSync } from "node:fs"

import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing"
import firebase from "firebase/compat/app"
import "firebase/compat/firestore"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

const projectId = "demo-quiz-site"
const adminUid = "authorized-admin"
const draftQuiz = "draft-quiz"
const rules = readFileSync("firestore.rules", "utf8")

let testEnv: RulesTestEnvironment

function quizData(published: boolean) {
  return {
    title: "Protected quiz",
    description: "Test quiz",
    category: "測試",
    published,
    results: [{ id: "result-1" }, { id: "result-2" }],
    questions: [{ id: "question-1" }],
    resultIds: ["result-1", "result-2"],
    createdAt: firebase.firestore.Timestamp.fromMillis(1),
    updatedAt: firebase.firestore.Timestamp.fromMillis(1),
  }
}

async function expectPermissionDenied(action: Promise<unknown>) {
  await expect(action).rejects.toMatchObject({ code: "permission-denied" })
}

async function expectProtectedDataUnchanged() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    const draft = await db.doc(`quizzes/${draftQuiz}`).get()
    const created = await db.doc("quizzes/unauthorized-create").get()

    expect(draft.data()?.title).toBe("Protected quiz")
    expect(created.exists).toBe(false)
  })
}

function waitForAdminRevocation(
  reference: firebase.firestore.DocumentReference,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let unsubscribe = () => {}
    const timeout = setTimeout(() => {
      unsubscribe()
      reject(new Error("管理員權限變更未即時反映"))
    }, 4000)

    unsubscribe = reference.onSnapshot(
      (snapshot) => {
        if (!snapshot.exists) {
          clearTimeout(timeout)
          unsubscribe()
          resolve()
        }
      },
      (error) => {
        clearTimeout(timeout)
        unsubscribe()
        reject(error)
      },
    )
  })
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules,
    },
  })
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await db.doc(`admins/${adminUid}`).set({})
    await db.doc(`quizzes/${draftQuiz}`).set(quizData(false))
    await db.doc("quizzes/published-quiz").set(quizData(true))
    await db.doc("submissions/submission-1").set({
      quizId: draftQuiz,
      resultId: "result-1",
      createdAt: firebase.firestore.Timestamp.fromMillis(1),
    })
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

describe("Firestore 管理員權限規則", () => {
  it("AC1：未登入者不能讀取草稿或統計，也不能新增、修改或刪除測驗", async () => {
    const db = testEnv.unauthenticatedContext().firestore()

    await expectPermissionDenied(db.doc(`quizzes/${draftQuiz}`).get())
    await expectPermissionDenied(db.collection("submissions").get())
    await expectPermissionDenied(
      db.doc("quizzes/unauthorized-create").set({
        ...quizData(true),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }),
    )
    await expectPermissionDenied(
      db.doc(`quizzes/${draftQuiz}`).update({
        title: "Changed without authorization",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }),
    )
    await expectPermissionDenied(db.doc(`quizzes/${draftQuiz}`).delete())

    await expectProtectedDataUnchanged()
  })

  it("AC2：已登入但非管理員者不能讀取或變更管理資料", async () => {
    const db = testEnv.authenticatedContext("regular-user").firestore()

    await expectPermissionDenied(db.doc(`quizzes/${draftQuiz}`).get())
    await expectPermissionDenied(db.collection("submissions").get())
    await expectPermissionDenied(
      db.doc(`quizzes/${draftQuiz}`).update({
        title: "Changed without authorization",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }),
    )
    await expectPermissionDenied(db.doc(`quizzes/${draftQuiz}`).delete())

    await expectProtectedDataUnchanged()
  })

  it("AC3：管理員文件撤銷後，原管理員的讀寫立即遭拒", async () => {
    const db = testEnv.authenticatedContext(adminUid).firestore()
    await expect(db.doc(`quizzes/${draftQuiz}`).get()).resolves.toMatchObject({
      exists: true,
    })

    const revocationObserved = waitForAdminRevocation(db.doc(`admins/${adminUid}`))
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc(`admins/${adminUid}`).delete()
    })
    await revocationObserved

    await expectPermissionDenied(db.doc(`quizzes/${draftQuiz}`).get())
    await expectPermissionDenied(db.collection("submissions").get())
    await expectPermissionDenied(
      db.doc(`quizzes/${draftQuiz}`).update({
        title: "Changed after revocation",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }),
    )

    await expectProtectedDataUnchanged()
  })

  it("AC4：登入憑證已逾期時，Firestore 拒絕受保護資料操作", async () => {
    const now = Math.floor(Date.now() / 1000)
    const expiredDb = testEnv
      .authenticatedContext("expired-user", { iat: now - 7200, exp: now - 3600 })
      .firestore()

    await expectPermissionDenied(expiredDb.doc(`quizzes/${draftQuiz}`).get())
    await expectPermissionDenied(
      expiredDb.doc(`quizzes/${draftQuiz}`).update({
        title: "Changed with expired credentials",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }),
    )

    await expectProtectedDataUnchanged()
  })

  it("AC5：有效管理員可管理測驗並讀取統計資料", async () => {
    const db = testEnv.authenticatedContext(adminUid).firestore()

    await expect(db.doc(`quizzes/${draftQuiz}`).get()).resolves.toMatchObject({
      exists: true,
    })
    await expect(db.collection("submissions").get()).resolves.toMatchObject({
      size: 1,
    })

    const created = db.doc("quizzes/created-by-admin")
    await created.set({
      ...quizData(true),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    await created.update({
      title: "Updated by admin",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
    await created.delete()

    await expect(created.get()).resolves.toMatchObject({ exists: false })
  })
})
