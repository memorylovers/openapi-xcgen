import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // プロジェクトモードを有効化（workspace は非推奨）
    projects: ["packages/*/vitest.config.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html", "lcov"],
      all: true,
      reportsDirectory: "./coverage",
      include: ["packages/*/src/**/*.ts"],
      exclude: ["dist/**", "**/*.d.ts", "**/*.config.*", "**/tests/**", "**/__fixtures__/**", "**/index.ts"],
    },
  },
});
