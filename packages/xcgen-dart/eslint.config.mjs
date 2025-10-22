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
];