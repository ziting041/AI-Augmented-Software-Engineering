import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app"
import {
  connectAuthEmulator,
  getAuth,
  type Auth,
} from "firebase/auth"
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore"

// Next.js 只會內嵌直接寫出的 process.env.NEXT_PUBLIC_*，不可改成動態存取
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// 開發時 HMR 會重複執行此模組，避免重複初始化
const isNewApp = getApps().length === 0
export const app: FirebaseApp = isNewApp ? initializeApp(firebaseConfig) : getApp()

export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app)

if (isNewApp && process.env.NEXT_PUBLIC_FIREBASE_EMULATORS === "true") {
  if (!firebaseConfig.projectId?.startsWith("demo-")) {
    throw new Error("Firebase Emulator 測試必須使用 demo 專案 ID")
  }

  connectAuthEmulator(auth, "http://127.0.0.1:9099", {
    disableWarnings: true,
  })
  connectFirestoreEmulator(db, "127.0.0.1", 8080)
}
