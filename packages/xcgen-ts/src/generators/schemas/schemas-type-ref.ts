/**
 * IR型からValibotスキーマ参照への変換
 *
 * allOf/anyOfで使用されるスキーマ参照文字列を生成
 */

import type { IRType } from "@openapi-xcgen/core";
import { generatePrimitiveSchema } from "./schemas-primitive";
import { toTypeName } from "../../helpers/naming";

/**
 * IRTypeをValibotスキーマ参照に変換（allOf/anyOf用）
 * @param type - IR型
 * @returns Valibotスキーマ参照文字列
 *
 * @example
 * ```typescript
 * // Primitive type
 * irTypeToValibotSchemaRef("string")
 * // => "v.string()"
 *
 * // Ref type
 * irTypeToValibotSchemaRef({ kind: "ref", name: "Pet" })
 * // => "PetSchema"
 *
 * // Array type
 * irTypeToValibotSchemaRef({ kind: "array", itemType: "string" })
 * // => "v.array(v.string())"
 * ```
 */
export function irTypeToValibotSchemaRef(type: IRType): string {
  if (typeof type === "string") {
    // Primitiveはそのまま生成
    return generatePrimitiveSchema(type);
  }

  // この時点でIRRefのみが残る（IRScalarTypeは上でチェック済み）
  // Core packageはreference path全体を保存: "#/components/schemas/Pet"
  // 最後のセグメントを抽出: "Pet"
  const modelName = type.name.split("/").at(-1) ?? type.name;
  return `${toTypeName(modelName)}Schema`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("schemas-type-ref", () => {
    describe("irTypeToValibotSchemaRef", () => {
      it("should convert scalar type to primitive schema", () => {
        expect(irTypeToValibotSchemaRef("string")).toBe("v.string()");
        expect(irTypeToValibotSchemaRef("int")).toBe("v.number()");
        expect(irTypeToValibotSchemaRef("boolean")).toBe("v.boolean()");
      });

      it("should convert ref type to schema reference", () => {
        const result = irTypeToValibotSchemaRef({ kind: "ref", name: "Pet" });
        expect(result).toBe("PetSchema");
      });
    });
  });
}
