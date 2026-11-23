import { readFileSync } from "node:fs"

import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing"
import { expect, test, type Page } from "@playwright/test"

const projectId = "demo-quiz-site"
const authEmulatorUrl = "http://127.0.0.1:9099"
const apiKey = "demo-api-key"
const password = "test-password-123"
const rules = readFileSync("firestore.rules", "utf8")

interface TestUser {
  uid: string
  email: string
}

interface AuthEmulatorUserResponse {
  localId: unknown
}

let testEnv: RulesTestEnvironment
let admin: TestUser
let member: TestUser

async function createAuthUser(email: string): Promise<TestUser> {
  const response = await fetch(
    `${authEmulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  )

  if (!response.ok) {
    throw new Error(
      `無法建立 Firebase Auth Emulator 測試帳號：${response.status} ${await response.text()}`,
    )
  }

  const payload: AuthEmulatorUserResponse = await response.json()
  if (typeof payload.localId !== "string") {
    throw new Error("Firebase Auth Emulator 未回傳有效的使用者 ID")
  }

  return { uid: payload.localId, email }
}

async function resetAuthEmulator(): Promise<void> {
  const response = await fetch(
    `${authEmulatorUrl}/emulator/v1/projects/${projectId}/accounts`,
    { method: "DELETE" },
  )

  if (!response.ok) {
    throw new Error(
      `無法重設 Firebase Auth Emulator：${response.status} ${await response.text()}`,
    )
  }
}

async function signIn(page: Page, user: TestUser): Promise<void> {
  await page.goto("/admin/login")
  await page.getByLabel("電子郵件").fill(user.email)
  await page.getByLabel("密碼").fill(password)
  await page.getByRole("button", { name: "登入" }).click()
}

test.beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { host: "127.0.0.1", port: 8080, rules },
  })
})

test.beforeEach(async () => {
  await resetAuthEmulator()
  await testEnv.clearFirestore()

  admin = await createAuthUser("admin@example.test")
  member = await createAuthUser("member@example.test")
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().doc(`admins/${admin.uid}`).set({})
  })
})

test.afterAll(async () => {
  await testEnv.cleanup()
})

test("[AC-6.1] 未登入的使用者會被導向管理員登入頁", async ({ page }) => {
  await page.goto("/admin")

  await expect(page).toHaveURL(/\/admin\/login$/)
  await expect(page.getByText("管理員登入", { exact: true })).toBeVisible()
  await expect(page.getByRole("heading", { name: "測驗管理" })).toHaveCount(0)
})

test("[AC-6.2] 已登入但非管理員的使用者無法進入管理頁", async ({ page }) => {
  await signIn(page, member)
  await expect(
    page.getByRole("alert").filter({ hasText: "不在管理員名單中" }),
  ).toBeVisible()

  await page.goto("/admin")
  await expect(page.getByText("你沒有管理員權限")).toBeVisible()
  await expect(page.getByRole("heading", { name: "測驗管理" })).toHaveCount(0)
})

test("[AC-6.3] 管理權限撤銷後，管理頁即時拒絕存取", async ({ page }) => {
  await signIn(page, admin)
  await expect(page.getByRole("heading", { name: "測驗管理" })).toBeVisible()

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().doc(`admins/${admin.uid}`).delete()
  })

  await expect(page.getByText("你沒有管理員權限")).toBeVisible()
  await page.goto("/admin/quizzes/new")
  await expect(page.getByText("你沒有管理員權限")).toBeVisible()
})

test("[AC-6.5] 有效管理員可建立測驗，使用者作答後管理員可讀取統計", async ({
  browser,
  page,
}) => {
  await signIn(page, admin)
  await expect(page.getByRole("heading", { name: "測驗管理" })).toBeVisible()
  await page.getByRole("link", { name: "新增測驗" }).click()

  await page.getByLabel("測驗標題").fill("Emulator 整合測驗")
  await page.getByLabel("測驗說明").fill("驗證真實資料流")
  await page.getByLabel("測驗分類").fill("整合測試")
  await page.getByText("發布（勾選後所有使用者都看得到）").click()
  await page.getByLabel("結果 1 名稱").fill("結果甲")
  await page.getByLabel("結果 1 說明").fill("第一種結果")
  await page.getByLabel("結果 2 名稱").fill("結果乙")
  await page.getByLabel("結果 2 說明").fill("第二種結果")
  await page.getByLabel("第 1 題題目內容").fill("選擇一個答案")
  await page.getByLabel("第 1 題選項 1內容").fill("答案甲")
  await page.getByLabel("第 1 題選項 1對結果 1 的分數").fill("2")
  await page.getByLabel("第 1 題選項 2內容").fill("答案乙")
  await page.getByLabel("第 1 題選項 2對結果 2 的分數").fill("2")

  await page.getByRole("button", { name: "儲存測驗" }).last().click()
  await expect(page.getByText("Emulator 整合測驗")).toBeVisible()

  const participantPage = await browser.newPage()
  await participantPage.goto("/")
  await participantPage
    .getByRole("link", { name: "開始「Emulator 整合測驗」" })
    .click()
  await participantPage.getByRole("button", { name: "開始測驗" }).click()
  await participantPage.getByRole("radio", { name: "答案甲" }).click()
  await participantPage.getByRole("button", { name: "看結果" }).click()
  await expect(participantPage.getByTestId("result-title")).toHaveText("結果甲")

  await page.goto("/admin")
  await page
    .getByRole("link", { name: "「Emulator 整合測驗」的統計" })
    .click()
  await expect(page.getByTestId("stats-total")).toHaveText("1")
  await expect(page.getByText("1 人・100%")).toBeVisible()

  await participantPage.close()
})

test("[AC-6.1] 管理者登出後重新進入管理頁會要求登入", async ({ page }) => {
  await signIn(page, admin)
  await expect(page.getByRole("heading", { name: "測驗管理" })).toBeVisible()
  await page.getByRole("button", { name: "登出" }).click()

  await expect(page).toHaveURL(/\/admin\/login$/)
  await expect(page.getByText("管理員登入", { exact: true })).toBeVisible()
})
