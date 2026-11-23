import { defineConfig, devices } from "@playwright/test"

const port = 3101

export default defineConfig({
  testDir: "./tests/e2e-firebase",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  workers: 1,
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium-firebase-emulator", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_DATA_BACKEND: "firebase",
      NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-quiz-site.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-quiz-site",
      NEXT_PUBLIC_FIREBASE_EMULATORS: "true",
      NEXT_DIST_DIR: ".next/e2e-firebase",
    },
  },
})
