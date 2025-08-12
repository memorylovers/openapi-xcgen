/**
 * Primitive type visitor
 *
 * @bnf-target <schema-object> のプリミティブ型部分
 * @bnf-ref _docs/900_openapi_v3.1_BNF_spec.md:309,336,352
 */

import { consola } from "consola";
import type { SchemaObject } from "../../types/index.js";
import type { IRPrimitive } from "../../types/ir/index.js";
import { toIRScalarType } from "../helpers/to-ir-scalar-type.js";

// OpenAPI 3.0.x supports nullable, 3.1.x uses type arrays
// For backward compatibility, we support nullable
type SchemaObjectWithNullable = SchemaObject & { nullable?: boolean };

/**
 * プリミティブ型のSchemaObjectをIRPrimitiveに変換
 *
 * @bnf <schema-object> - プリミティブ型を持つスキーマオブジェクト
 * @bnf-ref _docs/900_openapi_v3.1_BNF_spec.md:301-350
 * @bnf-fields
 *   - `type` (line 309): <type-value> - IRScalarType ("string" | "number" | "integer" | "boolean")
 *   - `format` (line 336): 型のフォーマット指定（例: "email", "date-time", "uuid"）
 *   - `nullable` (OpenAPI 3.0.x互換): 値がnullを許可するかの指定
 *
 * @param schema - 変換対象のスキーマ
 * @returns IRPrimitive型の結果、無効な場合はnull
 *
 * @example OpenAPI YAML
 * ```yaml
 * # 文字列型
 * name:
 *   type: string
 *
 * # 整数型（フォーマット付き）
 * age:
 *   type: integer
 *   format: int32
 *
 * # nullable文字列（OpenAPI 3.0.x）
 * description:
 *   type: string
 *   nullable: true
 *
 * # email形式の文字列
 * email:
 *   type: string
 *   format: email
 * ```
 */
export function visitPrimitive(
  schema: SchemaObjectWithNullable,
): IRPrimitive | null {
  const scalarType = toIRScalarType(schema.type);
  if (!scalarType) {
    consola.warn(`Invalid type for primitive visitor: ${schema.type}`);
    return null;
  }

  const result: IRPrimitive = {
    kind: "primitive",
    type: scalarType,
  };

  // format プロパティがある場合は追加
  if (schema.format) {
    result.format = schema.format;
  }

  // nullable プロパティがtrueの場合のみ追加
  if (schema.nullable === true) {
    result.nullable = true;
  }

  return result;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitPrimitive", () => {
    it("should convert string schema to IRPrimitive", () => {
      const schema: SchemaObjectWithNullable = { type: "string" };
      const result = visitPrimitive(schema);

      expect(result).toEqual({
        kind: "primitive",
        type: "string",
      });
    });

    it("should convert number schema to IRPrimitive", () => {
      const schema: SchemaObjectWithNullable = { type: "number" };
      const result = visitPrimitive(schema);

      expect(result).toEqual({
        kind: "primitive",
        type: "number",
      });
    });

    it("should convert integer schema to IRPrimitive", () => {
      const schema: SchemaObjectWithNullable = { type: "integer" };
      const result = visitPrimitive(schema);

      expect(result).toEqual({
        kind: "primitive",
        type: "integer",
      });
    });

    it("should convert boolean schema to IRPrimitive", () => {
      const schema: SchemaObjectWithNullable = { type: "boolean" };
      const result = visitPrimitive(schema);

      expect(result).toEqual({
        kind: "primitive",
        type: "boolean",
      });
    });

    it("should handle format property", () => {
      const schema: SchemaObjectWithNullable = {
        type: "string",
        format: "email",
      };
      const result = visitPrimitive(schema);

      expect(result).toEqual({
        kind: "primitive",
        type: "string",
        format: "email",
      });
    });

    it("should handle various formats", () => {
      const formats = ["date", "date-time", "uri", "uuid", "email"] as const;

      formats.forEach((format) => {
        const schema: SchemaObjectWithNullable = {
          type: "string",
          format,
        };
        const result = visitPrimitive(schema);

        expect(result).toEqual({
          kind: "primitive",
          type: "string",
          format,
        });
      });
    });

    it("should handle nullable property", () => {
      const schema: SchemaObjectWithNullable = {
        type: "string",
        nullable: true,
      };
      const result = visitPrimitive(schema);

      expect(result).toEqual({
        kind: "primitive",
        type: "string",
        nullable: true,
      });
    });

    it("should handle both format and nullable", () => {
      const schema: SchemaObjectWithNullable = {
        type: "string",
        format: "email",
        nullable: true,
      };
      const result = visitPrimitive(schema);

      expect(result).toEqual({
        kind: "primitive",
        type: "string",
        format: "email",
        nullable: true,
      });
    });

    it("should not include nullable when false or undefined", () => {
      const schemaWithFalse: SchemaObjectWithNullable = {
        type: "string",
        nullable: false,
      };
      const schemaWithoutNullable: SchemaObjectWithNullable = {
        type: "string",
      };

      const resultWithFalse = visitPrimitive(schemaWithFalse);
      const resultWithoutNullable = visitPrimitive(schemaWithoutNullable);

      expect(resultWithFalse).toEqual({
        kind: "primitive",
        type: "string",
      });
      expect(resultWithoutNullable).toEqual({
        kind: "primitive",
        type: "string",
      });
    });

    it("should return null and warn for non-primitive types", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const schema = { type: "array" } as any;

      const result = visitPrimitive(schema);

      expect(result).toBe(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid type for primitive visitor: array",
      );

      warnSpy.mockRestore();
    });
  });
}
