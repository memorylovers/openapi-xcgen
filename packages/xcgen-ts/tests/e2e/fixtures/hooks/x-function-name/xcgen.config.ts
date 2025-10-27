import { defineConfig } from "../../../../../src/index";
import type { HookContext } from "../../../../../src/hooks/types";

export default defineConfig({
  input: "./openapi.yaml",
  output: "./generated",
  hooks: {
    "endpoint:generate": (ctx: HookContext<"endpoint:generate">) => {
      // x-function-name があれば関数名を変換
      if (ctx.extensions?.["x-function-name"]) {
        ctx.tsCode.functionName = ctx.extensions["x-function-name"] as string;
      }
    },
  },
});
