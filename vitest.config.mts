import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  // Uncomment to use workspace mode
  // workspace: [
  //   "packages/*/vitest.config.ts"
  // ]
});
