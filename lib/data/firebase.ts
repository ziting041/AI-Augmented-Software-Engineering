import { FirebaseError } from "firebase/app"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore"

import { auth, db } from "@/lib/firebase/client"
import type { Quiz, QuizDraft } from "@/lib/quiz/types"
import { sortByUpdatedDesc } from "./serialize"
import {
  DataError,
  type AdminSession,
  type AuthService,
  type QuizRepository,
  type Repositories,
  type SubmissionRepository,
} from "./types"

const QUIZZES = "quizzes"
const SUBMISSIONS = "submissions"
const ADMINS = "admins"

function toMillis(value: unknown): number | null {
  return value instanceof Timestamp ? value.toMillis() : null
}

function fromFirestore(id: string, data: DocumentData): Quiz {
  return {
    id,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    published: data.published === true,
    results: Array.isArray(data.results) ? data.results : [],
    questions: Array.isArray(data.questions) ? data.questions : [],
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  }
}

/** 寫入 Firestore 的欄位；resultIds 供安全規則驗證作答結果是否合法 */
function toFirestore(draft: QuizDraft) {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    published: draft.published,
    results: draft.results,
    questions: draft.questions,
    resultIds: draft.results.map((r) => r.id),
    updatedAt: serverTimestamp(),
  }
}

function isPermissionDenied(error: unknown): boolean {
  return error instanceof FirebaseError && error.code === "permission-denied"
}

function wrap(error: unknown, message: string): DataError {
  if (isPermissionDenied(error)) {
    return new DataError("權限不足：請確認你已用管理員帳號登入", { cause: error })
  }
  return new DataError(message, { cause: error })
}

const quizzes: QuizRepository = {
  async listPublished() {
    try {
      const snap = await getDocs(
        query(collection(db, QUIZZES), where("published", "==", true)),
      )
      return sortByUpdatedDesc(snap.docs.map((d) => fromFirestore(d.id, d.data())))
    } catch (error) {
      throw wrap(error, "無法載入測驗清單")
    }
  },

  async listAll() {
    try {
      const snap = await getDocs(collection(db, QUIZZES))
      return sortByUpdatedDesc(snap.docs.map((d) => fromFirestore(d.id, d.data())))
    } catch (error) {
      throw wrap(error, "無法載入測驗清單")
    }
  },

  async get(id) {
    try {
      const snap = await getDoc(doc(db, QUIZZES, id))
      return snap.exists() ? fromFirestore(snap.id, snap.data()) : null
    } catch (error) {
      // 未發布的測驗對一般使用者而言等同不存在
      if (isPermissionDenied(error)) return null
      throw wrap(error, "無法載入測驗")
    }
  },

  async create(draft) {
    try {
      const ref = doc(collection(db, QUIZZES))
      await setDoc(ref, { ...toFirestore(draft), createdAt: serverTimestamp() })
      return ref.id
    } catch (error) {
      throw wrap(error, "無法建立測驗")
    }
  },

  async update(id, draft) {
    try {
      await updateDoc(doc(db, QUIZZES, id), toFirestore(draft))
    } catch (error) {
      throw wrap(error, "無法儲存測驗")
    }
  },

  async remove(id) {
    try {
      await deleteDoc(doc(db, QUIZZES, id))
    } catch (error) {
      throw wrap(error, "無法刪除測驗")
    }
  },
}

const submissions: SubmissionRepository = {
  async submit(quizId, resultId) {
    try {
      await addDoc(collection(db, SUBMISSIONS), {
        quizId,
        resultId,
        createdAt: serverTimestamp(),
      })
    } catch (error) {
      throw wrap(error, "無法記錄作答結果")
    }
  },

  async countByResult(quizId, resultIds) {
    try {
      // 等值條件組合可由單欄位索引處理，不需建立複合索引
      const entries = await Promise.all(
        resultIds.map(async (resultId) => {
          const snap = await getCountFromServer(
            query(
              collection(db, SUBMISSIONS),
              where("quizId", "==", quizId),
              where("resultId", "==", resultId),
            ),
          )
          return [resultId, snap.data().count] as const
        }),
      )
      return Object.fromEntries(entries)
    } catch (error) {
      throw wrap(error, "無法載入統計資料")
    }
  },
}

const authService: AuthService = {
  subscribe(listener) {
    listener({ status: "loading" })
    let latest = 0
    return onAuthStateChanged(auth, async (user) => {
      const ticket = ++latest
      if (!user) {
        listener({ status: "signed-out" })
        return
      }
      // 管理員名單存在 admins/{uid}，只能由 Firebase Console 或 Admin SDK 新增
      let isAdmin = false
      try {
        isAdmin = (await getDoc(doc(db, ADMINS, user.uid))).exists()
      } catch {
        isAdmin = false
      }
      if (ticket !== latest) return
      const session: AdminSession = {
        status: "signed-in",
        email: user.email ?? "",
        isAdmin,
      }
      listener(session)
    })
  },

  async signIn(email, password) {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      const code = error instanceof FirebaseError ? error.code : ""
      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password" ||
        code === "auth/user-not-found" ||
        code === "auth/invalid-email"
      ) {
        throw new DataError("帳號或密碼錯誤", { cause: error })
      }
      if (code === "auth/too-many-requests") {
        throw new DataError("嘗試次數過多，請稍後再試", { cause: error })
      }
      throw new DataError("登入失敗，請稍後再試", { cause: error })
    }
  },

  async signOut() {
    await signOut(auth)
  },
}

export function createFirebaseRepositories(): Repositories {
  return { backend: "firebase", quizzes, submissions, auth: authService }
}
