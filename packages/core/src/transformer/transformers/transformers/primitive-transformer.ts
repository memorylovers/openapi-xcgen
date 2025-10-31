/**
 * Primitive Transformer - v2 Transformer Architecture
 *
 * プリミティブ型スキーマと$ref参照をIRTypeに変換します。
 * トラバーサルは不要（リーフノード）のため、純粋な型解決のみを行います。
 *
 * @bnf-target <schema-object> | <reference-object>
 * @bnf-ref _docs/900_openapi_v3.1_BNF_spec.md:298-365,581
 */

import { consola } from "consola";
import type { ReferenceObject, SchemaObjectWithNullable } from "../../../types";
import { isReferenceObject } from "../../../types";
import { toIRScalarType } from "../../helpers";
import type { VisitorContext } from "../../types";
import { createErrorResult } from "../errors";
import type { TransformResult } from "../types";

/**
 * SchemaObjectをIRTypeに解決
 *
 * @bnf <schema-object> - OpenAPI 3.1 BNF非終端記号
 * @bnf-ref _docs/900_openapi_v3.1_BNF_spec.md:298-365
 * @bnf-fields
 *   - `$ref` (line 307): <reference-object>への参照
 *   - `type` (line 309): プリミティブ型や配列型の指定
 *   - `format` (line 336): 型のフォーマット指定
 *
 * @param schema - 変換対象のスキーマ
 * @param context - Visitorコンテキスト（現在は使用していないが、将来の拡張用）
 * @returns 変換結果（type: IRType, models: []）
 *
 * @example OpenAPI YAML
 * ```yaml
 * # プリミティブ型
 * title:
 *   type: string
 *
 * # フォーマット付きプリミティブ
 * createdAt:
 *   type: string
 *   format: date-time
 *
 * # 参照型
 * user:
 *   $ref: '#/components/schemas/User'
 *
 * # OpenAPI 3.1のnull型
 * nullValue:
 *   type: null
 *
 * # OpenAPI 3.1の型配列
 * stringOrNull:
 *   type: [string, null]
 * ```
 */
export function transformPrimitive(
  schema: SchemaObjectWithNullable | ReferenceObject,
  _context: VisitorContext,
): TransformResult {
  // $ref参照の場合
  if (isReferenceObject(schema)) {
    // IRRef設計に従い完全パス形式を使用
    return {
      type: { kind: "ref", name: schema.$ref },
      models: [],
    };
  }

  // プリミティブ型: 直接IRScalarTypeを返す
  // OpenAPI 3.1ではtypeが配列の場合もあるので、文字列の場合のみ処理
  if (typeof schema.type === "string") {
    const formatValue =
      typeof schema.format === "string" ? schema.format : null;
    const scalarType = toIRScalarType(schema.type, formatValue);
    if (scalarType) {
      return {
        type: scalarType,
        models: [],
      };
    }
  }

  // OpenAPI 3.1: typeが配列の場合（例: ["string", "null"]）
  // nullableはプロパティレベルで処理するため、ここでは最初の非null型を返す
  if (Array.isArray(schema.type)) {
    // null以外の最初の型を探す
    const nonNullType = schema.type.find((t) => t !== "null");
    if (nonNullType) {
      const formatValue =
        typeof schema.format === "string" ? schema.format : null;
      const scalarType = toIRScalarType(nonNullType, formatValue);
      if (scalarType) {
        return {
          type: scalarType,
          models: [],
        };
      }
    }
    // 配列に"null"のみの場合
    if (schema.type.length === 1 && schema.type[0] === "null") {
      return {
        type: "null",
        models: [],
      };
    }
  }

  // その他の型は無効として扱う
  return createErrorResult(
    `Invalid or unsupported schema type: ${schema.type}`,
    "INVALID_SCHEMA_TYPE",
    { schemaType: schema.type },
  );
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("transformPrimitive", () => {
    it("should resolve primitive types", () => {
      const schema: SchemaObjectWithNullable = { type: "string" };
      const result = transformPrimitive(schema, {
        documentPath: [
          "components",
          "schemas",
          "Example",
          "properties",
          "name",
        ],
        rootSegment: "components",
      });
      expect(result.type).toEqual("string");
      expect(result.models).toEqual([]);
    });

    it("should resolve integer with format", () => {
      const schema: SchemaObjectWithNullable = {
        type: "integer",
        format: "int64",
      };
      const result = transformPrimitive(schema, {
        documentPath: ["components", "schemas", "Example", "properties", "id"],
        rootSegment: "components",
      });
      expect(result.type).toEqual("long");
      expect(result.models).toEqual([]);
    });

    it("should resolve string with date format", () => {
      const schema: SchemaObjectWithNullable = {
        type: "string",
        format: "date-time",
      };
      const result = transformPrimitive(schema, {
        documentPath: [
          "components",
          "schemas",
          "Example",
          "properties",
          "createdAt",
        ],
        rootSegment: "components",
      });
      expect(result.type).toEqual("datetime");
      expect(result.models).toEqual([]);
    });

    it("should return error result for array types (should use dispatchSchema)", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const schema: SchemaObjectWithNullable = {
        type: "array",
        items: { type: "string" },
      };
      const result = transformPrimitive(schema, {
        documentPath: [
          "components",
          "schemas",
          "Example",
          "properties",
          "tags",
        ],
        rootSegment: "components",
      });
      expect(result.type).toEqual(null);
      expect(result.error?.code).toBe("INVALID_SCHEMA_TYPE");
      warnSpy.mockRestore();
    });

    it("should return error result for nested array types (should use dispatchSchema)", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const schema: SchemaObjectWithNullable = {
        type: "array",
        items: {
          type: "array",
          items: { type: "number" },
        },
      };
      const result = transformPrimitive(schema, {
        documentPath: ["components", "schemas", "Matrix", "properties", "data"],
        rootSegment: "components",
      });
      expect(result.type).toEqual(null);
      expect(result.error?.code).toBe("INVALID_SCHEMA_TYPE");
      warnSpy.mockRestore();
    });

    it("should resolve $ref types", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const schema = { $ref: "#/components/schemas/User" } as any;
      const result = transformPrimitive(schema, {
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
      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/User",
      });
      expect(result.models).toEqual([]);
    });

    it("should return error result for empty schemas", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const schema: SchemaObjectWithNullable = {};
      const result = transformPrimitive(schema, {
        documentPath: ["components", "schemas", "Empty"],
        rootSegment: "components",
      });

      expect(result.type).toEqual(null);
      expect(result.error?.code).toBe("INVALID_SCHEMA_TYPE");

      warnSpy.mockRestore();
    });

    it("should return error result for object types (should use dispatchSchema)", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const schema: SchemaObjectWithNullable = { type: "object" };
      const result = transformPrimitive(schema, {
        documentPath: ["components", "schemas", "ObjectType"],
        rootSegment: "components",
      });

      expect(result.type).toEqual(null);
      expect(result.error?.code).toBe("INVALID_SCHEMA_TYPE");

      warnSpy.mockRestore();
    });

    it("should return error result for array without items", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const schema = { type: "array" } as any;
      const result = transformPrimitive(schema, {
        documentPath: ["components", "schemas", "ArrayWithoutItems"],
        rootSegment: "components",
      });
      expect(result.type).toEqual(null);
      expect(result.error?.code).toBe("INVALID_SCHEMA_TYPE");
      warnSpy.mockRestore();
    });

    it("should return error result for array with invalid item type", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const schema = {
        type: "array",
        items: { type: "invalid" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const result = transformPrimitive(schema, {
        documentPath: ["components", "schemas", "ArrayWithInvalidItems"],
        rootSegment: "components",
      });

      expect(result.type).toEqual(null);
      expect(result.error?.code).toBe("INVALID_SCHEMA_TYPE");
      warnSpy.mockRestore();
    });

    it("should handle nullable primitive", () => {
      const schema: SchemaObjectWithNullable = {
        type: "string",
        nullable: true,
      };
      const result = transformPrimitive(schema, {
        documentPath: ["components", "schemas", "NullableString"],
        rootSegment: "components",
      });
      // nullableはプロパティレベルで管理されるため、scalar typeにはnullableプロパティがない
      expect(result.type).toEqual("string");
      expect(result.models).toEqual([]);
    });

    it("should handle format in primitive", () => {
      const schema: SchemaObjectWithNullable = {
        type: "string",
        format: "email",
      };
      const result = transformPrimitive(schema, {
        documentPath: ["components", "schemas", "Email"],
        rootSegment: "components",
      });
      // email formatは通常のstringとして扱われる
      expect(result.type).toEqual("string");
      expect(result.models).toEqual([]);
    });

    it("should handle special format in primitive", () => {
      const schema: SchemaObjectWithNullable = {
        type: "string",
        format: "date-time",
      };
      const result = transformPrimitive(schema, {
        documentPath: ["components", "schemas", "DateTime"],
        rootSegment: "components",
      });
      // date-time formatは特別な型として扱われる
      expect(result.type).toEqual("datetime");
      expect(result.models).toEqual([]);
    });

    it("should handle null type (OpenAPI 3.1)", () => {
      const schema: SchemaObjectWithNullable = {
        type: "null",
      };
      const result = transformPrimitive(schema, {
        documentPath: ["components", "schemas", "NullValue"],
        rootSegment: "components",
      });
      // OpenAPI 3.1のnull型は特別なスカラー型として扱う
      expect(result.type).toEqual("null");
      expect(result.models).toEqual([]);
    });

    it("should handle array type with null (OpenAPI 3.1)", () => {
      const schema = {
        type: ["string", "null"],
      } as SchemaObjectWithNullable;
      const result = transformPrimitive(schema, {
        documentPath: ["components", "schemas", "StringOrNull"],
        rootSegment: "components",
      });
      // 型配列の最初の非null型を返す（nullableはプロパティレベルで処理）
      expect(result.type).toEqual("string");
      expect(result.models).toEqual([]);
    });

    it("should handle array type with only null (OpenAPI 3.1)", () => {
      const schema = {
        type: ["null"],
      } as SchemaObjectWithNullable;
      const result = transformPrimitive(schema, {
        documentPath: ["components", "schemas", "OnlyNull"],
        rootSegment: "components",
      });
      // null型のみの配列はnull型として扱う
      expect(result.type).toEqual("null");
      expect(result.models).toEqual([]);
    });
  });
}
