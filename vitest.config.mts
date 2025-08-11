import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // プロジェクトモードを有効化（workspace は非推奨）
    projects: ["packages/*/vitest.config.ts"],
  },
});
