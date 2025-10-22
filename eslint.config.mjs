import baseConfig from "./eslint.config.base.mjs";

export default [
  ...baseConfig,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
    languageOptions: {
      parserOptions: {
        project: [
          "./tsconfig.json",
          "./packages/*/tsconfig.json",
          "./examples/*/tsconfig.json",
        ],
      },
    },
  },
  {
    files: ["examples/**/*.ts"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
];