import baseConfig from "../../eslint.config.base.mjs";

export default [
  ...baseConfig,
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
      },
    },
  },
  {
    // Ignore generated expected files (they contain intentional issues for testing)
    ignores: [
      "tests/e2e/fixtures/*/expected/**",
      "tests/e2e/fixtures/*/*/expected/**",
      "tests/e2e/fixtures/*/*/*/expected/**",
    ],
  },
];