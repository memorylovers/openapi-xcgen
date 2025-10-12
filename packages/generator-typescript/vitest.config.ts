import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    globals: true,
    environment: "node",
    includeSource: ["src/**/*.ts"],
  },
  define: {
    "import.meta.vitest": "undefined",
  },
});
