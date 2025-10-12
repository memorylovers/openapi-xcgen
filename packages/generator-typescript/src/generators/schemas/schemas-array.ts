/**
 * Arrayスキーマ生成
 */

import type { IRValidation } from "@openapi-xcgen/core";
import { generateValidationPipes } from "./schemas-validation.js";

/**
 * Array型のValibotスキーマを生成
 * @param itemSchemaRef - アイテムスキーマへの参照（変数名）
 * @param validation - バリデーション情報（minItems/maxItems）
 * @returns Valibotスキーマ文字列
 *
 * @example
 * ```typescript
 * generateArraySchema("StringSchema", { minItems: 1, maxItems: 10 })
 * // => "v.pipe(v.array(StringSchema), v.minLength(1), v.maxLength(10))"
 * ```
 */
export function generateArraySchema(
  itemSchemaRef: string,
  validation?: IRValidation,
): string {
  const baseSchema = `v.array(${itemSchemaRef})`;

  // minItems/maxItems → minLength/maxLength に変換
  const arrayValidation: IRValidation | undefined = validation
    ? {
        minLength: validation.minItems,
        maxLength: validation.maxItems,
      }
    : undefined;

  const pipes = generateValidationPipes(arrayValidation);

  if (pipes.length === 0) {
    return baseSchema;
  }

  return `v.pipe(${baseSchema}, ${pipes.join(", ")})`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("schemas-array", () => {
    describe("generateArraySchema", () => {
      it("should generate basic array schema", () => {
        const result = generateArraySchema("v.string()");
        expect(result).toBe("v.array(v.string())");
      });

      it("should generate array schema with minItems", () => {
        const result = generateArraySchema("v.string()", { minItems: 1 });
        expect(result).toBe("v.pipe(v.array(v.string()), v.minLength(1))");
      });

      it("should generate array schema with maxItems", () => {
        const result = generateArraySchema("v.string()", { maxItems: 10 });
        expect(result).toBe("v.pipe(v.array(v.string()), v.maxLength(10))");
      });

      it("should generate array schema with minItems and maxItems", () => {
        const result = generateArraySchema("v.string()", {
          minItems: 1,
          maxItems: 10,
        });
        expect(result).toBe(
          "v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(10))",
        );
      });

      it("should work with schema reference", () => {
        const result = generateArraySchema("PetSchema", { minItems: 1 });
        expect(result).toBe("v.pipe(v.array(PetSchema), v.minLength(1))");
      });
    });
  });
}
