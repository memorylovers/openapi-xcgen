/**
 * Map スキーマ生成
 */

import type { IRValidation } from "@openapi-xcgen/core";
import type { TypeGenerationContext } from "../types/generation-context";
import { generateValidationPipes } from "./schemas-validation";

/**
 * Map型のValibotスキーマを生成
 * @param valueSchemaRef - 値スキーマへの参照（変数名）
 * @param validation - バリデーション情報（minProperties/maxProperties）
 * @param ctx - Type generation context
 * @returns Valibotスキーマ文字列
 *
 * @example
 * ```typescript
 * generateMapSchema("v.string()", { minProperties: 1, maxProperties: 10 }, ctx)
 * // => "v.pipe(v.record(v.string(), v.string()), v.minLength(1), v.maxLength(10))"
 * ```
 */
export function generateMapSchema(
  valueSchemaRef: string,
  validation: IRValidation | undefined,
  ctx: TypeGenerationContext,
): string {
  const baseSchema = `v.record(v.string(), ${valueSchemaRef})`;

  // minProperties/maxProperties → minLength/maxLength に変換
  const mapValidation: IRValidation | undefined = validation
    ? {
        minLength: validation.minProperties,
        maxLength: validation.maxProperties,
      }
    : undefined;

  // マップバリデーション用のパイプ生成
  const pipes = generateValidationPipes(
    mapValidation,
    "string", // プレースホルダー（Hookが型情報を参照する可能性がある）
    ctx,
  );

  if (pipes.length === 0) {
    return baseSchema;
  }

  return `v.pipe(${baseSchema}, ${pipes.join(", ")})`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  const mockCtx: TypeGenerationContext = {
    ir: {
      metadata: { title: "Test API", version: "1.0.0" },
      components: [],
      tags: [],
      endpoints: [],
    },
  };

  describe("schemas-map", () => {
    describe("generateMapSchema", () => {
      it("should generate basic map schema", () => {
        const result = generateMapSchema("v.string()", undefined, mockCtx);
        expect(result).toBe("v.record(v.string(), v.string())");
      });

      it("should generate map schema with minProperties", () => {
        const result = generateMapSchema(
          "v.string()",
          { minProperties: 1 },
          mockCtx,
        );
        expect(result).toBe(
          "v.pipe(v.record(v.string(), v.string()), v.minLength(1))",
        );
      });

      it("should generate map schema with maxProperties", () => {
        const result = generateMapSchema(
          "v.string()",
          { maxProperties: 10 },
          mockCtx,
        );
        expect(result).toBe(
          "v.pipe(v.record(v.string(), v.string()), v.maxLength(10))",
        );
      });

      it("should generate map schema with minProperties and maxProperties", () => {
        const result = generateMapSchema(
          "v.string()",
          { minProperties: 1, maxProperties: 10 },
          mockCtx,
        );
        expect(result).toBe(
          "v.pipe(v.record(v.string(), v.string()), v.minLength(1), v.maxLength(10))",
        );
      });
    });
  });
}
