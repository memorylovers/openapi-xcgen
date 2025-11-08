/**
 * IR型からValibotスキーマ文字列への変換
 *
 * IRTypeをValibotのスキーマ表現に変換し、バリデーションパイプを適用する
 */

import type { IRExtensions, IRType, IRValidation } from "@openapi-xcgen/core";
import { toTypeName } from "../../helpers/naming";
import type { TypeGenerationContext } from "../types/generation-context";
import { generatePrimitiveSchema } from "./schemas-primitive";
import { generateValidationPipes } from "./schemas-validation";

/**
 * IRTypeをValibotスキーマ文字列に変換
 * @param type - IR型
 * @param validation - バリデーション制約（オプション）
 * @param ctx - Type generation context
 * @param extensions - x-extensions（オプション）
 * @returns Valibotスキーマ文字列
 *
 * @example
 * ```typescript
 * // Primitive type
 * irTypeToValibotSchema("string", undefined, ctx)
 * // => "v.string()"
 *
 * // With validation
 * irTypeToValibotSchema("string", { minLength: 1, maxLength: 100 }, ctx)
 * // => "v.pipe(v.string(), v.minLength(1), v.maxLength(100))"
 *
 * // Ref type
 * irTypeToValibotSchema({ kind: "ref", referencePath: "Pet" }, undefined, ctx)
 * // => "PetSchema"
 *
 * // Array type
 * irTypeToValibotSchema({ kind: "array", itemType: "string" }, undefined, ctx)
 * // => "v.array(v.string())"
 * ```
 */
export function irTypeToValibotSchema(
  type: IRType,
  validation: IRValidation | undefined,
  ctx: TypeGenerationContext,
  extensions?: IRExtensions,
): string {
  // const値がある場合はv.literal()を使用（discriminatorプロパティ用）
  if (validation?.const !== undefined) {
    const literalValue =
      typeof validation.const === "string"
        ? `"${validation.const}"`
        : validation.const;
    return `v.literal(${literalValue})`;
  }

  let baseSchema: string;

  // IRScalarType (string literal)
  if (typeof type === "string") {
    baseSchema = generatePrimitiveSchema(type);
  } else {
    // IRRef, IRArray, IRMap (objects with kind property)
    switch (type.kind) {
      case "ref": {
        // $ref参照 → {TypeName}Schema
        // Core packageはreference path全体を保存: "#/components/schemas/Base"
        // 最後のセグメントを抽出: "Base"
        const modelName =
          type.referencePath.split("/").at(-1) ?? type.referencePath;
        baseSchema = `${toTypeName(modelName)}Schema`;
        break;
      }

      default: {
        baseSchema = "v.any()";
      }
    }
  }

  // バリデーションパイプを追加
  const pipes = validation
    ? generateValidationPipes(validation, type, ctx, extensions)
    : [];
  if (pipes.length > 0) {
    return `v.pipe(${baseSchema}, ${pipes.join(", ")})`;
  }

  return baseSchema;
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

  describe("schemas-type-mapper", () => {
    describe("irTypeToValibotSchema", () => {
      it("should convert scalar type to primitive schema", () => {
        expect(irTypeToValibotSchema("string", undefined, mockCtx)).toBe(
          "v.string()",
        );
        expect(irTypeToValibotSchema("int", undefined, mockCtx)).toBe(
          "v.number()",
        );
        expect(irTypeToValibotSchema("boolean", undefined, mockCtx)).toBe(
          "v.boolean()",
        );
      });

      it("should convert ref type to schema reference", () => {
        const result = irTypeToValibotSchema(
          {
            kind: "ref",
            referencePath: "Pet",
          },
          undefined,
          mockCtx,
        );
        expect(result).toBe("PetSchema");
      });

      it("should apply validation pipes", () => {
        const result = irTypeToValibotSchema(
          "string",
          {
            minLength: 1,
            maxLength: 100,
          },
          mockCtx,
        );
        expect(result).toBe(
          "v.pipe(v.string(), v.minLength(1), v.maxLength(100))",
        );
      });

      it("should handle validation with pattern", () => {
        const result = irTypeToValibotSchema(
          "string",
          {
            pattern: "^[a-z]+$",
          },
          mockCtx,
        );
        expect(result).toBe("v.pipe(v.string(), v.regex(/^[a-z]+$/))");
      });
    });
  });
}
