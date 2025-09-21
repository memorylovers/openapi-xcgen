/**
 * additionalPropertiesをIRTypeに変換するヘルパー関数
 */

import { consola } from "consola";
import type {
  IRType,
  ReferenceObject,
  SchemaObject,
  SchemaObjectWithNullable,
} from "../../../types";
import type { VisitorContext } from "../../types";
import { visitType } from "./type-visitor";

/**
 * additionalPropertiesをIRTypeに変換
 *
 * @param additionalProperties - OpenAPIのadditionalProperties値
 * @param context - Visitorコンテキスト
 * @returns IRType型の結果、無効な場合はnull
 *
 * @example
 * ```yaml
 * # プリミティブ型
 * additionalProperties:
 *   type: string
 *
 * # 参照型
 * additionalProperties:
 *   $ref: '#/components/schemas/MetadataValue'
 *
 * # 配列型
 * additionalProperties:
 *   type: array
 *   items:
 *     type: string
 *
 * # boolean値
 * additionalProperties: true  # any型として扱う
 * additionalProperties: false # 追加プロパティ禁止
 * ```
 */
export function visitAdditionalProperties(
  additionalProperties: SchemaObject | ReferenceObject | boolean,
  context: VisitorContext,
): IRType | null {
  // boolean値の処理
  if (typeof additionalProperties === "boolean") {
    if (additionalProperties === true) {
      // true = any型相当（現時点では未サポート）
      consola.warn(
        `additionalProperties: true (any type) is not fully supported yet`,
      );
      return "string"; // 暫定的にstringとして扱う
    } else {
      // false = 追加プロパティ禁止
      return null;
    }
  }

  // SchemaObject | ReferenceObjectの処理
  // visitTypeを使って通常の型変換処理を行う
  const schemaObj = additionalProperties as SchemaObjectWithNullable;
  const result = visitType(schemaObj, context);

  if (!result) {
    consola.warn(`Failed to convert additionalProperties to IRType`);
  }

  return result;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitAdditionalProperties", () => {
    it("should convert primitive type", () => {
      const schema: SchemaObjectWithNullable = {
        type: "string",
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Test"],
        rootSegment: "components",
      };

      const result = visitAdditionalProperties(schema, context);
      expect(result).toBe("string");
    });

    it("should convert array type", () => {
      const schema: SchemaObjectWithNullable = {
        type: "array",
        items: { type: "string" },
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Test"],
        rootSegment: "components",
      };

      const result = visitAdditionalProperties(schema, context);
      expect(result).toEqual({
        kind: "array",
        itemType: "string",
      });
    });

    it("should convert reference type", () => {
      const schema: ReferenceObject = {
        $ref: "#/components/schemas/MetadataValue",
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Test"],
        rootSegment: "components",
      };

      const result = visitAdditionalProperties(schema, context);
      expect(result).toEqual({
        kind: "ref",
        name: "#/components/schemas/MetadataValue",
      });
    });

    it("should handle boolean true with warning", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Test"],
        rootSegment: "components",
      };

      const result = visitAdditionalProperties(true, context);
      expect(result).toBe("string"); // 暫定的にstring
      expect(warnSpy).toHaveBeenCalledWith(
        "additionalProperties: true (any type) is not fully supported yet",
      );
      warnSpy.mockRestore();
    });

    it("should handle boolean false", () => {
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Test"],
        rootSegment: "components",
      };

      const result = visitAdditionalProperties(false, context);
      expect(result).toBeNull();
    });
  });
}
