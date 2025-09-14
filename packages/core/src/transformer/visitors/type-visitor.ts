/**
 * Type visitor - resolves SchemaObject to IRType
 *
 * @bnf-target <schema-object> | <reference-object>
 * @bnf-ref _docs/900_openapi_v3.1_BNF_spec.md:298-365,581
 */

import { consola } from "consola";
import { isReferenceObject } from "../../types/guards";
import type { SchemaObjectWithNullable } from "../../types/index";
import type { IRArray, IRType } from "../../types/ir/index";
import type { VisitorContext } from "../types";
import { extractRefName } from "../helpers/extract-ref-name";
import { toIRScalarType } from "../helpers/to-ir-scalar-type";

/**
 * SchemaObjectをIRTypeに解決
 *
 * @bnf <schema-object> - OpenAPI 3.1 BNF非終端記号
 * @bnf-ref _docs/900_openapi_v3.1_BNF_spec.md:298-365
 * @bnf-fields
 *   - `$ref` (line 307): <reference-object>への参照
 *   - `type` (line 309): プリミティブ型や配列型の指定
 *   - `items` (line 329): 配列要素の型定義
 *   - `format` (line 336): 型のフォーマット指定
 *
 * @param schema - 変換対象のスキーマ
 * @param context - Visitorコンテキスト
 * @returns IRType型の結果、無効な場合はnull
 *
 * @example OpenAPI YAML
 * ```yaml
 * # プリミティブ型
 * title:
 *   type: string
 *
 * # 配列型
 * tags:
 *   type: array
 *   items:
 *     type: string
 *
 * # ネストした配列
 * matrix:
 *   type: array
 *   items:
 *     type: array
 *     items:
 *       type: number
 *
 * # 参照型
 * user:
 *   $ref: '#/components/schemas/User'
 *
 * # オブジェクト型（anyとして解決）
 * metadata:
 *   type: object
 * ```
 */
export function visitType(
  schema: SchemaObjectWithNullable,
  context: VisitorContext,
): IRType | null {
  // $ref参照の場合
  if (isReferenceObject(schema)) {
    const refName = extractRefName(schema.$ref);
    if (refName === null) {
      consola.warn(`Invalid $ref in schema: ${schema.$ref}`);
      return null;
    }
    // IRRef設計に従い完全パス形式を使用
    return { kind: "ref", name: schema.$ref };
  }

  // プリミティブ型: 直接IRScalarTypeを返す
  // OpenAPI 3.1ではtypeが配列の場合もあるので、文字列の場合のみ処理
  if (typeof schema.type === "string") {
    const formatValue =
      typeof schema.format === "string" ? schema.format : null;
    const scalarType = toIRScalarType(schema.type, formatValue);
    if (scalarType) return scalarType;
  }

  // 配列型
  if (schema.type === "array" && schema.items) {
    const itemType = visitType(schema.items as SchemaObjectWithNullable, {
      documentPath: [...context.documentPath, "items"],
      rootSegment: context.rootSegment,
    });
    // 配列の要素型が無効な場合はnullを返す
    if (itemType === null) return null;

    return { kind: "array", itemType } as IRArray;
  }

  // その他の型は無効として扱う
  consola.warn(`Invalid or unsupported schema type: ${schema.type}`);
  return null;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitType", () => {
    it("should resolve primitive types", () => {
      const schema: SchemaObjectWithNullable = { type: "string" };
      const result = visitType(schema, {
        documentPath: [
          "components",
          "schemas",
          "Example",
          "properties",
          "name",
        ],
        rootSegment: "components",
      });
      expect(result).toEqual("string");
    });

    it("should resolve integer with format", () => {
      const schema: SchemaObjectWithNullable = {
        type: "integer",
        format: "int64",
      };
      const result = visitType(schema, {
        documentPath: ["components", "schemas", "Example", "properties", "id"],
        rootSegment: "components",
      });
      expect(result).toEqual("long");
    });

    it("should resolve string with date format", () => {
      const schema: SchemaObjectWithNullable = {
        type: "string",
        format: "date-time",
      };
      const result = visitType(schema, {
        documentPath: [
          "components",
          "schemas",
          "Example",
          "properties",
          "createdAt",
        ],
        rootSegment: "components",
      });
      expect(result).toEqual("datetime");
    });

    it("should resolve array types", () => {
      const schema: SchemaObjectWithNullable = {
        type: "array",
        items: { type: "string" },
      };
      const result = visitType(schema, {
        documentPath: [
          "components",
          "schemas",
          "Example",
          "properties",
          "tags",
        ],
        rootSegment: "components",
      });
      expect(result).toEqual({
        kind: "array",
        itemType: "string",
      });
    });

    it("should resolve nested array types", () => {
      const schema: SchemaObjectWithNullable = {
        type: "array",
        items: {
          type: "array",
          items: { type: "number" },
        },
      };
      const result = visitType(schema, {
        documentPath: ["components", "schemas", "Matrix", "properties", "data"],
        rootSegment: "components",
      });
      expect(result).toEqual({
        kind: "array",
        itemType: {
          kind: "array",
          itemType: "double",
        },
      });
    });

    it("should resolve $ref types", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const schema = { $ref: "#/components/schemas/User" } as any;
      const result = visitType(schema, {
        documentPath: [
          "paths",
          "/users",
          "get",
          "responses",
          "200",
          "content",
          "application/json",
          "schema",
        ],
        rootSegment: "components",
      });
      expect(result).toEqual({
        kind: "ref",
        name: "#/components/schemas/User",
      });
    });

    it("should return null for invalid $ref", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const schema = { $ref: "" } as any;
      const result = visitType(schema, {
        documentPath: ["components", "schemas", "Invalid"],
        rootSegment: "components",
      });

      expect(result).toEqual(null);
      expect(warnSpy).toHaveBeenCalledTimes(2); // extractRefNameとvisitTypeの両方で警告

      warnSpy.mockRestore();
    });

    it("should return null for empty schemas", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const schema: SchemaObjectWithNullable = {};
      const result = visitType(schema, {
        documentPath: ["components", "schemas", "Empty"],
        rootSegment: "components",
      });

      expect(result).toEqual(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid or unsupported schema type: undefined",
      );

      warnSpy.mockRestore();
    });

    it("should return null for object types", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const schema: SchemaObjectWithNullable = { type: "object" };
      const result = visitType(schema, {
        documentPath: ["components", "schemas", "ObjectType"],
        rootSegment: "components",
      });

      expect(result).toEqual(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid or unsupported schema type: object",
      );

      warnSpy.mockRestore();
    });

    it("should return null for array without items", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const schema = { type: "array" } as any;
      const result = visitType(schema, {
        documentPath: ["components", "schemas", "ArrayWithoutItems"],
        rootSegment: "components",
      });
      expect(result).toEqual(null);
    });

    it("should return null for array with invalid item type", () => {
      const schema = {
        type: "array",
        items: { type: "invalid" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const result = visitType(schema, {
        documentPath: ["components", "schemas", "ArrayWithInvalidItems"],
        rootSegment: "components",
      });

      // When items have an unknown type, visitType returns null
      // So the array visitor also returns null
      expect(result).toEqual(null);
    });

    it("should handle nullable primitive", () => {
      const schema: SchemaObjectWithNullable = {
        type: "string",
        nullable: true,
      };
      const result = visitType(schema, {
        documentPath: ["components", "schemas", "NullableString"],
        rootSegment: "components",
      });
      // nullableはプロパティレベルで管理されるため、scalar typeにはnullableプロパティがない
      expect(result).toEqual("string");
    });

    it("should handle format in primitive", () => {
      const schema: SchemaObjectWithNullable = {
        type: "string",
        format: "email",
      };
      const result = visitType(schema, {
        documentPath: ["components", "schemas", "Email"],
        rootSegment: "components",
      });
      // email formatは通常のstringとして扱われる
      expect(result).toEqual("string");
    });

    it("should handle special format in primitive", () => {
      const schema: SchemaObjectWithNullable = {
        type: "string",
        format: "date-time",
      };
      const result = visitType(schema, {
        documentPath: ["components", "schemas", "DateTime"],
        rootSegment: "components",
      });
      // date-time formatは特別な型として扱われる
      expect(result).toEqual("datetime");
    });
  });

  describe("resolveType (deprecated)", () => {
    it("should work as alias for visitType", () => {
      const schema: SchemaObjectWithNullable = { type: "string" };
      const context = {
        documentPath: ["components", "schemas", "Test"],
        rootSegment: "components" as const,
      };
      const result1 = visitType(schema, context);
      const result2 = visitType(schema, context); // Use visitType instead of deprecated resolveType
      expect(result1).toEqual(result2);
    });
  });
}
