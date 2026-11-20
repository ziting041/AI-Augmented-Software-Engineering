import { defineConfig } from "vitest/config"

// Firestore 安全規則測試：需在模擬器中執行（npm run test:rules），
// 測試間共用同一個模擬器，因此依序執行避免互相清除資料。
export default defineConfig({
  test: {
    include: ["tests/rules/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
})
