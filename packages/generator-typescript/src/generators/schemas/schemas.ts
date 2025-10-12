/**
 * Valibot スキーマ生成器（Orchestrator）
 *
 * IRModelからValibotのバリデーションスキーマを生成する
 */

import type { XcgenIR } from "@openapi-xcgen/core";
import { generateSchemasHeader } from "./schemas-header.js";
import { generateSchemasImports } from "./schemas-imports.js";
import { generateSchemaModel } from "./schemas-model.js";

/**
 * 生成されたValibotスキーマコード
 */
export interface GeneratedSchemas {
  /** 生成されたTypeScriptコード */
  code: string;
  /** 生成されたスキーマの数 */
  count: number;
}

/**
 * XcgenIRからValibotスキーマを生成
 * @param ir - 中間表現
 * @returns 生成されたTypeScriptコード
 *
 * @example
 * ```typescript
 * const ir: XcgenIR = { ... };
 * const result = generateSchemas(ir);
 * console.log(result.code); // Valibotスキーマ定義
 * console.log(result.count); // 5 (スキーマの数)
 * ```
 */
export function generateSchemas(ir: XcgenIR): GeneratedSchemas {
  const parts: string[] = [];

  // ファイルヘッダー
  parts.push(generateSchemasHeader(ir.metadata));
  parts.push("");

  // インポート文
  parts.push(generateSchemasImports());
  parts.push("");

  let count = 0;

  // 各モデルをスキーマに変換
  for (const model of ir.models) {
    const schemaCode = generateSchemaModel(model);
    if (schemaCode) {
      parts.push(schemaCode);
      parts.push("");
      count++;
    }
  }

  return {
    code: parts.join("\n"),
    count,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("schemas generator", () => {
    describe("generateSchemas", () => {
      it("should generate schemas from XcgenIR", () => {
        const ir: XcgenIR = {
          metadata: {
            title: "Pet Store API",
            version: "1.0.0",
          },
          models: [
            {
              kind: "object",
              name: "Pet",
              referencePath: "#/components/schemas/Pet",
              properties: [
                {
                  name: "id",
                  type: "int",
                  required: true,
                },
                {
                  name: "name",
                  type: "string",
                  required: true,
                },
              ],
            },
          ],
          tags: [],
          endpoints: [],
        };

        const result = generateSchemas(ir);

        expect(result.count).toBe(1);
        expect(result.code.trim()).toEqual(
          `
/**
 * Valibot validation schemas
 * Generated from: Pet Store API 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";

/**
 * Schema for Pet
 */
export const PetSchema = v.object({
  id: v.number(),
  name: v.string(),
});
`.trim(),
        );
      });
    });
  });
}
