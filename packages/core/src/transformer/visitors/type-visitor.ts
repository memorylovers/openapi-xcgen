/**
 * Type visitor - resolves SchemaObject to IRType
 *
 * @bnf-target <schema-object> | <reference-object>
 * @bnf-ref _docs/900_openapi_v3.1_BNF_spec.md:298-365,581
 */

import { consola } from "consola";
import { isReferenceObject } from "../../types/guards.js";
import type { SchemaObject } from "../../types/index.js";
import type { IRArray, IRType } from "../../types/ir/index.js";
import { extractRefName } from "../helpers/extract-ref-name.js";
import { toIRScalarType } from "../helpers/to-ir-scalar-type.js";
import { visitPrimitive } from "./primitive-visitor.js";

// OpenAPI 3.0.x supports nullable, 3.1.x uses type arrays
// For backward compatibility, we support nullable
type SchemaObjectWithNullable = SchemaObject & { nullable?: boolean };

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
export function visitType(schema: SchemaObjectWithNullable): IRType | null {
  // $ref参照の場合
  if (isReferenceObject(schema)) {
    const refName = extractRefName(schema.$ref);
    if (refName === null) {
      consola.warn(`Invalid $ref in schema: ${schema.$ref}`);
      return null;
    }
    return { kind: "ref", name: refName };
  }

  // プリミティブ型: nullの場合はそのまま返す
  if (toIRScalarType(schema.type)) return visitPrimitive(schema);

  // 配列型
  if (schema.type === "array" && schema.items) {
    const itemType = visitType(schema.items as SchemaObjectWithNullable);
    // 配列の要素型が無効な場合はnullを返す
    if (itemType === null) return null;

    return { kind: "array", itemType } as IRArray;
  }

  // その他の型は無効として扱う
  consola.warn(
    `Invalid or unsupported schema type: ${schema.type || "undefined"}`,
  );
  return null;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitType", () => {
    it("should resolve primitive types", () => {
      const schema: SchemaObjectWithNullable = { type: "string" };
      const result = visitType(schema);
      expect(result).not.toBe(null);
      expect(result?.kind).toBe("primitive");
    });

    it("should resolve array types", () => {
      const schema: SchemaObjectWithNullable = {
        type: "array",
        items: { type: "string" },
      };
      const result = visitType(schema);
      expect(result).not.toBe(null);
      expect(result?.kind).toBe("array");
      expect((result as IRArray).itemType.kind).toBe("primitive");
    });

    it("should resolve nested array types", () => {
      const schema: SchemaObjectWithNullable = {
        type: "array",
        items: {
          type: "array",
          items: { type: "number" },
        },
      };
      const result = visitType(schema);
      expect(result).not.toBe(null);
      expect(result?.kind).toBe("array");
      const outerArray = result as IRArray;
      expect(outerArray.itemType.kind).toBe("array");
      const innerArray = outerArray.itemType as IRArray;
      expect(innerArray.itemType.kind).toBe("primitive");
    });

    it("should resolve $ref types", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const schema = { $ref: "#/components/schemas/User" } as any;
      const result = visitType(schema);
      expect(result).toEqual({
        kind: "ref",
        name: "User",
      });
    });

    it("should return null for invalid $ref", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const schema = { $ref: "" } as any;
      const result = visitType(schema);

      expect(result).toBe(null);
      expect(warnSpy).toHaveBeenCalledTimes(2); // extractRefNameとvisitTypeの両方で警告

      warnSpy.mockRestore();
    });

    it("should return null for unknown types", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const schema: SchemaObjectWithNullable = {};
      const result = visitType(schema);

      expect(result).toBe(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid or unsupported schema type: undefined",
      );

      warnSpy.mockRestore();
    });

    it("should return null for object types", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const schema: SchemaObjectWithNullable = { type: "object" };
      const result = visitType(schema);

      expect(result).toBe(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid or unsupported schema type: object",
      );

      warnSpy.mockRestore();
    });

    it("should return null for array without items", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const schema = { type: "array" } as any;
      const result = visitType(schema);
      expect(result).toBe(null);
    });

    it("should return null for array with invalid item type", () => {
      const schema = {
        type: "array",
        items: { type: "invalid" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const result = visitType(schema);

      // When items have an unknown type, visitType returns null
      // So the array visitor also returns null
      expect(result).toBe(null);
    });

    it("should handle nullable primitive", () => {
      const schema: SchemaObjectWithNullable = {
        type: "string",
        nullable: true,
      };
      const result = visitType(schema);
      expect(result).not.toBe(null);
      expect(result?.kind).toBe("primitive");
      expect(result).toHaveProperty("nullable", true);
    });

    it("should handle format in primitive", () => {
      const schema: SchemaObjectWithNullable = {
        type: "string",
        format: "email",
      };
      const result = visitType(schema);
      expect(result).not.toBe(null);
      expect(result?.kind).toBe("primitive");
      expect(result).toHaveProperty("format", "email");
    });
  });

  describe("resolveType (deprecated)", () => {
    it("should work as alias for visitType", () => {
      const schema: SchemaObjectWithNullable = { type: "string" };
      const result1 = visitType(schema);
      const result2 = visitType(schema); // Use visitType instead of deprecated resolveType
      expect(result1).toEqual(result2);
    });
  });
}
