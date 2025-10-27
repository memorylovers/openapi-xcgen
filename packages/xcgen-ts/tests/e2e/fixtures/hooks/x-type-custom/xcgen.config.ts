import { defineConfig } from "../../../../../src/index";
import type { HookContext } from "../../../../../src/hooks/types";

export default defineConfig({
  input: "./openapi.yaml",
  output: "./generated",
  hooks: {
    "property:generate": (ctx: HookContext<"property:generate">) => {
      // x-type があれば型名を変換
      if (ctx.extensions?.["x-type"]) {
        ctx.tsCode.typeName = ctx.extensions["x-type"] as string;
      }
    },
    "modelFile:generate": (ctx: HookContext<"modelFile:generate">) => {
      // カスタム型を収集して1つのimport文にまとめる
      const customTypes: string[] = [];
      const modelProperties =
        "properties" in ctx.model ? ctx.model.properties : [];

      for (const prop of modelProperties) {
        const xType = prop.extensions?.["x-type"];
        if (xType) {
          customTypes.push(xType as string);
        }
      }

      // 型をアルファベット順にソートして1つのimport文にまとめる
      if (customTypes.length > 0) {
        const sorted = [...new Set(customTypes)].sort(); // 重複削除 + ソート
        ctx.tsCode.imports.push(
          `import type { ${sorted.join(", ")} } from "../_userdefs"`,
        );
      }
    },
  },
});
