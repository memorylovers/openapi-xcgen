/**
 * Map Traverser - v2 Transformer Architecture
 *
 * Map型スキーマ（additionalPropertiesのみ）の値を訪問し、
 * 値の型と抽出されたモデルを返します。
 * 変換処理は map-transformer に委譲します。
 */

import { consola } from "consola";
import type {
  ReferenceObject,
  SchemaObject,
  SchemaObjectWithNullable,
} from "../../../types";
import { buildReferencePath, getComponentName } from "../../helpers";
import type { VisitorContext } from "../../types";
import { createAdditionalPropertiesTraversalError } from "../errors";
import type { AdditionalPropertiesTraversalResult } from "../types";

/**
 * スキーマ訪問関数の型
 */
type VisitSchemaFn = (
  schema: SchemaObjectWithNullable | ReferenceObject,
  context: VisitorContext,
) => { type: unknown; components: unknown[] };

/**
 * Map型スキーマ（additionalPropertiesのみ）の値を訪問
 *
 * @param schema - Mapスキーマ
 * @param context - 親コンテキスト
 * @param visitSchema - スキーマ訪問関数（再帰用）
 * @returns Map値のトラバーサル結果
 */
export function traverseMapValue(
  schema: SchemaObject & {
    additionalProperties?: boolean | SchemaObjectWithNullable | ReferenceObject;
  },
  context: VisitorContext,
  visitSchema: VisitSchemaFn,
): AdditionalPropertiesTraversalResult {
  const additional = schema.additionalProperties;

  // additionalProperties が undefined の場合
  if (additional === undefined) {
    return {
      type: undefined,
      components: [],
    };
  }

  // additionalProperties: true の場合（any型、サポート外）
  if (additional === true) {
    return createAdditionalPropertiesTraversalError(
      "additionalProperties: true (any type) is not supported; specify a schema for map values",
      "MAP_ANY_TYPE_NOT_SUPPORTED",
      { documentPath: context.documentPath },
    );
  }

  // additionalProperties: false の場合
  if (additional === false) {
    return {
      type: undefined,
      components: [],
    };
  }

  // additionalProperties にスキーマが指定されている場合
  const name = getComponentName(context);
  const valueContext: VisitorContext = {
    documentPath: [...context.documentPath.slice(0, -1), `${name}Value`],
    rootSegment: context.rootSegment,
  };

  const valueResult = visitSchema(additional, valueContext);

  if (!valueResult.type) {
    const referencePath = buildReferencePath(context.documentPath);
    return createAdditionalPropertiesTraversalError(
      `Failed to process additionalProperties-only schema: ${referencePath}`,
      "MAP_VALUE_RESOLUTION_FAILED",
      { documentPath: context.documentPath, referencePath },
    );
  }

  return {
    type: valueResult.type as AdditionalPropertiesTraversalResult["type"],
    components:
      valueResult.components as AdditionalPropertiesTraversalResult["components"],
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("traverseMapValue", () => {
    it("should traverse map value with primitive type", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "string",
        components: [],
      });

      const schema: SchemaObject = {
        type: "object",
        additionalProperties: { type: "string" },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "StringMap"],
        rootSegment: "components",
      };

      const result = traverseMapValue(schema, context, mockVisitSchema);

      expect(result).toEqual({
        type: "string",
        components: [],
      });

      expect(mockVisitSchema).toHaveBeenCalledWith(
        { type: "string" },
        {
          documentPath: ["components", "schemas", "StringMapValue"],
          rootSegment: "components",
        },
      );
    });

    it("should traverse map value with complex type", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: {
          kind: "ref",
          referencePath: "#/components/schemas/ArrayMapValue",
        },
        components: [
          {
            kind: "array",
            name: "ArrayMapValue",
            referencePath: "#/components/schemas/ArrayMapValue",
            itemType: "string",
          },
        ],
      });

      const schema: SchemaObject = {
        type: "object",
        additionalProperties: {
          type: "array",
          items: { type: "string" },
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "ArrayMap"],
        rootSegment: "components",
      };

      const result = traverseMapValue(schema, context, mockVisitSchema);

      expect(result.type).toEqual({
        kind: "ref",
        referencePath: "#/components/schemas/ArrayMapValue",
      });
      expect(result.components).toHaveLength(1);
      expect(result.components[0].kind).toBe("array");
    });

    it("should return undefined when additionalProperties is missing", () => {
      const mockVisitSchema = vi.fn();

      const schema: SchemaObject = {
        type: "object",
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "NoAdditional"],
        rootSegment: "components",
      };

      const result = traverseMapValue(schema, context, mockVisitSchema);

      expect(result).toEqual({
        type: undefined,
        components: [],
      });
      expect(mockVisitSchema).not.toHaveBeenCalled();
    });

    it("should warn when additionalProperties is true", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const mockVisitSchema = vi.fn();

      const schema: SchemaObject = {
        type: "object",
        additionalProperties: true,
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "AnyMap"],
        rootSegment: "components",
      };

      const result = traverseMapValue(schema, context, mockVisitSchema);

      expect(result).toEqual({
        type: undefined,
        components: [],
        error: {
          code: "MAP_ANY_TYPE_NOT_SUPPORTED",
          message:
            "additionalProperties: true (any type) is not supported; specify a schema for map values",
          context: {
            documentPath: ["components", "schemas", "AnyMap"],
          },
        },
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "additionalProperties: true (any type) is not supported; specify a schema for map values",
      );
      expect(mockVisitSchema).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it("should return undefined when additionalProperties is false", () => {
      const mockVisitSchema = vi.fn();

      const schema: SchemaObject = {
        type: "object",
        additionalProperties: false,
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "NoExtra"],
        rootSegment: "components",
      };

      const result = traverseMapValue(schema, context, mockVisitSchema);

      expect(result).toEqual({
        type: undefined,
        components: [],
      });
      expect(mockVisitSchema).not.toHaveBeenCalled();
    });

    it("should warn when value type resolution fails", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: null,
        components: [],
      });

      const schema: SchemaObject = {
        type: "object",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        additionalProperties: { type: "invalid" } as any,
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "FailedMap"],
        rootSegment: "components",
      };

      const result = traverseMapValue(schema, context, mockVisitSchema);

      expect(result).toEqual({
        type: undefined,
        components: [],
        error: {
          code: "MAP_VALUE_RESOLUTION_FAILED",
          message:
            "Failed to process additionalProperties-only schema: #/components/schemas/FailedMap",
          context: {
            documentPath: ["components", "schemas", "FailedMap"],
            referencePath: "#/components/schemas/FailedMap",
          },
        },
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "Failed to process additionalProperties-only schema: #/components/schemas/FailedMap",
      );

      warnSpy.mockRestore();
    });
  });
}
