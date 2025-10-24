/**
 * IR型からValibotスキーマ文字列への変換
 *
 * IRTypeをValibotのスキーマ表現に変換し、バリデーションパイプを適用する
 */

import type { IRType, IRValidation } from "@openapi-xcgen/core";
import { generatePrimitiveSchema } from "./schemas-primitive";
import { generateValidationPipes } from "./schemas-validation";
import { toTypeName } from "../../helpers/naming";

/**
 * IRTypeをValibotスキーマ文字列に変換
 * @param type - IR型
 * @param validation - バリデーション制約（オプション）
 * @returns Valibotスキーマ文字列
 *
 * @example
 * ```typescript
 * // Primitive type
 * irTypeToValibotSchema("string")
 * // => "v.string()"
 *
 * // With validation
 * irTypeToValibotSchema("string", { minLength: 1, maxLength: 100 })
 * // => "v.pipe(v.string(), v.minLength(1), v.maxLength(100))"
 *
 * // Ref type
 * irTypeToValibotSchema({ kind: "ref", name: "Pet" })
 * // => "PetSchema"
 *
 * // Array type
 * irTypeToValibotSchema({ kind: "array", itemType: "string" })
 * // => "v.array(v.string())"
 * ```
 */
export function irTypeToValibotSchema(
  type: IRType,
  validation?: IRValidation,
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
        const modelName = type.name.split("/").at(-1) ?? type.name;
        baseSchema = `${toTypeName(modelName)}Schema`;
        break;
      }

      case "array": {
        const itemSchema = irTypeToValibotSchema(type.itemType);
        baseSchema = `v.array(${itemSchema})`;
        break;
      }

      case "map": {
        const valueSchema = irTypeToValibotSchema(type.valueType);
        baseSchema = `v.record(v.string(), ${valueSchema})`;
        break;
      }

      default: {
        const _: never = type;
        void _;
        baseSchema = "v.any()";
      }
    }
  }

  // バリデーションパイプを追加
  const pipes = validation ? generateValidationPipes(validation) : [];
  if (pipes.length > 0) {
    return `v.pipe(${baseSchema}, ${pipes.join(", ")})`;
  }

  return baseSchema;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("schemas-type-mapper", () => {
    describe("irTypeToValibotSchema", () => {
      it("should convert scalar type to primitive schema", () => {
        expect(irTypeToValibotSchema("string")).toBe("v.string()");
        expect(irTypeToValibotSchema("int")).toBe("v.number()");
        expect(irTypeToValibotSchema("boolean")).toBe("v.boolean()");
      });

      it("should convert ref type to schema reference", () => {
        const result = irTypeToValibotSchema({ kind: "ref", name: "Pet" });
        expect(result).toBe("PetSchema");
      });

      it("should convert array type to array schema", () => {
        const result = irTypeToValibotSchema({
          kind: "array",
          itemType: "string",
        });
        expect(result).toBe("v.array(v.string())");
      });

      it("should convert nested array type", () => {
        const result = irTypeToValibotSchema({
          kind: "array",
          itemType: { kind: "ref", name: "User" },
        });
        expect(result).toBe("v.array(UserSchema)");
      });

      it("should convert map type to record schema", () => {
        const result = irTypeToValibotSchema({
          kind: "map",
          valueType: "int",
        });
        expect(result).toBe("v.record(v.string(), v.number())");
      });

      it("should apply validation pipes", () => {
        const result = irTypeToValibotSchema("string", {
          minLength: 1,
          maxLength: 100,
        });
        expect(result).toBe(
          "v.pipe(v.string(), v.minLength(1), v.maxLength(100))",
        );
      });

      it("should handle validation with pattern", () => {
        const result = irTypeToValibotSchema("string", {
          pattern: "^[a-z]+$",
        });
        expect(result).toBe("v.pipe(v.string(), v.regex(/^[a-z]+$/))");
      });
    });
  });
}
