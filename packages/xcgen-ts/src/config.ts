/**
 * 設定ファイルの読み込み
 *
 * c12 を使用して xcgen.config.ts を読み込む
 */

import { loadConfig } from "c12";
import type { GeneratorOptions } from "./types";

/**
 * xcgen.config.ts から設定を読み込む
 *
 * @param options - CLIまたはAPIから渡されたオプション（優先される）
 * @returns マージされた設定
 *
 * @example
 * ```typescript
 * // CLI から呼び出し
 * const config = await loadGeneratorConfig({
 *   input: './openapi.yaml',
 *   output: './generated'
 * });
 *
 * // config.hooks にはユーザー定義Hookが含まれる
 * ```
 */
export async function loadGeneratorConfig(
  options: Partial<GeneratorOptions>,
): Promise<GeneratorOptions> {
  // c12 で xcgen.config.ts を読み込む
  const { config } = await loadConfig<GeneratorOptions>({
    name: "xcgen",
    defaults: {
      input: "",
      output: "",
      validator: undefined,
      templatesDir: undefined,
      hooks: undefined,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    overrides: options as any,
    // TypeScript設定ファイルを読み込むために jiti を使用
    // （c12が自動的に処理）
  });

  // 必須フィールドの検証
  if (!config.input) {
    throw new Error("input is required");
  }
  if (!config.output) {
    throw new Error("output is required");
  }

  return config as GeneratorOptions;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("loadGeneratorConfig", () => {
    it("should load config with required fields", async () => {
      const config = await loadGeneratorConfig({
        input: "./openapi.yaml",
        output: "./generated",
      });

      expect(config.input).toBe("./openapi.yaml");
      expect(config.output).toBe("./generated");
    });

    it("should throw error if input is missing", async () => {
      await expect(
        loadGeneratorConfig({ output: "./generated" }),
      ).rejects.toThrow("input is required");
    });

    it("should throw error if output is missing", async () => {
      await expect(
        loadGeneratorConfig({ input: "./openapi.yaml" }),
      ).rejects.toThrow("output is required");
    });

    it("should accept optional validator", async () => {
      const config = await loadGeneratorConfig({
        input: "./openapi.yaml",
        output: "./generated",
        validator: "valibot",
      });

      expect(config.validator).toBe("valibot");
    });

    it("should accept optional hooks", async () => {
      const hooks = {
        "property:generate": async () => {},
      };

      const config = await loadGeneratorConfig({
        input: "./openapi.yaml",
        output: "./generated",
        hooks,
      });

      expect(config.hooks).toBe(hooks);
    });
  });
}
