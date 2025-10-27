import { defineConfig } from "../../../../../src/index";
import type { HookContext } from "../../../../../src/hooks/types";

export default defineConfig({
  input: "./openapi.yaml",
  output: "./generated",
  hooks: {
    "validation:transform": (ctx: HookContext<"validation:transform">) => {
      // x-validation があればカスタムバリデーション関数を追加
      if (ctx.extensions?.["x-validation"]) {
        ctx.tsCode.pipes.push(`v.custom(${ctx.extensions["x-validation"]})`);
      }
    },
    "modelFile:generate": (ctx: HookContext<"modelFile:generate">) => {
      // バリデーション関数を収集して1つのimport文にまとめる
      const validationFunctions: string[] = [];
      const modelProperties =
        "properties" in ctx.model ? ctx.model.properties : [];

      for (const prop of modelProperties) {
        const xValidation = prop.extensions?.["x-validation"];
        if (xValidation) {
          validationFunctions.push(xValidation as string);
        }
      }

      // 関数をソートして1つのimport文にまとめる（スキーマファイル用）
      if (validationFunctions.length > 0) {
        const sorted = [...new Set(validationFunctions)].sort(); // 重複削除 + ソート
        if (!ctx.tsCode.schemaImports) ctx.tsCode.schemaImports = [];
        ctx.tsCode.schemaImports.push(
          `import { ${sorted.join(", ")} } from "../_userdefs"`,
        );
      }
    },
  },
});
