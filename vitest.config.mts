import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    // E2E 測試（tests/e2e/*.spec.ts）由 Playwright 執行，不納入 Vitest
    include: ["lib/**/*.test.ts"],
  },
})
