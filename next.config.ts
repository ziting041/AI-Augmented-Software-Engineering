import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright 使用獨立的輸出目錄，才能與開發中的 next dev 同時執行
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

export default nextConfig;
