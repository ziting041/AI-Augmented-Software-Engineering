import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * E2E 測試使用本機模式（localStorage），不會連到正式的 Firebase 專案。
 * 每個測試都在全新的瀏覽器 context 執行，localStorage 互不影響。
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev --port ${PORT}`,
    // 獨立輸出目錄：避免與開發者正在跑的 next dev 互相鎖住
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { NEXT_PUBLIC_DATA_BACKEND: "local", NEXT_DIST_DIR: ".next/e2e" },
  },
});
