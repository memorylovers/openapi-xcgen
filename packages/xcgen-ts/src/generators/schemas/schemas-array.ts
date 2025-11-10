/**
 * Arrayスキーマ生成
 */

import type { IRExtensions, IRValidation } from "@openapi-xcgen/core";
import type { TypeGenerationContext } from "../types/generation-context";
import { generateValidationPipes } from "./schemas-validation";

/**
 * Array型のValibotスキーマを生成
 * @param itemSchemaRef - アイテムスキーマへの参照（変数名）
 * @param validation - バリデーション情報（minItems/maxItems）
 * @param ctx - Type generation context
 * @param extensions - x-extensions（オプション）
 * @returns Valibotスキーマ文字列
 *
 * @example
 * ```typescript
 * generateArraySchema("StringSchema", { minItems: 1, maxItems: 10 }, ctx)
 * // => "v.pipe(v.array(StringSchema), v.minLength(1), v.maxLength(10))"
 * ```
 */
export function generateArraySchema(
  itemSchemaRef: string,
  validation: IRValidation | undefined,
  ctx: TypeGenerationContext,
  extensions?: IRExtensions,
): string {
  const baseSchema = `v.array(${itemSchemaRef})`;

  // minItems/maxItems → minLength/maxLength に変換
  const arrayValidation: IRValidation | undefined = validation
    ? {
        minLength: validation.minItems,
        maxLength: validation.maxItems,
      }
    : undefined;

  // 配列バリデーション用のIRType（Hook context用プレースホルダー）
  // 実際のvalidation生成には型情報は不要だが、Hookが型情報を参照する可能性があるため"string"を渡す
  const pipes = generateValidationPipes(
    arrayValidation,
    "string",
    ctx,
    extensions,
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

  describe("schemas-array", () => {
    describe("generateArraySchema", () => {
      it("should generate basic array schema", () => {
        const result = generateArraySchema("v.string()", undefined, mockCtx);
        expect(result).toBe("v.array(v.string())");
      });

      it("should generate array schema with minItems", () => {
        const result = generateArraySchema(
          "v.string()",
          { minItems: 1 },
          mockCtx,
        );
        expect(result).toBe("v.pipe(v.array(v.string()), v.minLength(1))");
      });

      it("should generate array schema with maxItems", () => {
        const result = generateArraySchema(
          "v.string()",
          { maxItems: 10 },
          mockCtx,
        );
        expect(result).toBe("v.pipe(v.array(v.string()), v.maxLength(10))");
      });

      it("should generate array schema with minItems and maxItems", () => {
        const result = generateArraySchema(
          "v.string()",
          {
            minItems: 1,
            maxItems: 10,
          },
          mockCtx,
        );
        expect(result).toBe(
          "v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(10))",
        );
      });

      it("should work with schema reference", () => {
        const result = generateArraySchema(
          "PetSchema",
          { minItems: 1 },
          mockCtx,
        );
        expect(result).toBe("v.pipe(v.array(PetSchema), v.minLength(1))");
      });
    });
  });
}
