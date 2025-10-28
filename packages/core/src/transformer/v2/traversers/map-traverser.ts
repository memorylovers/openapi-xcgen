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
import { buildReferencePath, getModelName } from "../../helpers";
import type { VisitorContext } from "../../types";
import type { AdditionalPropertiesTraversalResult } from "../types";

/**
 * スキーマ訪問関数の型
 */
type VisitSchemaFn = (
  schema: SchemaObjectWithNullable | ReferenceObject,
  context: VisitorContext,
) => { type: unknown; models: unknown[] };

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
      models: [],
    };
  }

  // additionalProperties: true の場合（any型、サポート外）
  if (additional === true) {
    consola.warn(
      "additionalProperties: true (any type) is not supported; specify a schema for map values",
    );
    return {
      type: undefined,
      models: [],
    };
  }

  // additionalProperties: false の場合
  if (additional === false) {
    return {
      type: undefined,
      models: [],
    };
  }

  // additionalProperties にスキーマが指定されている場合
  const name = getModelName(context);
  const valueContext: VisitorContext = {
    documentPath: [...context.documentPath.slice(0, -1), `${name}Value`],
    rootSegment: context.rootSegment,
  };

  const valueResult = visitSchema(additional, valueContext);

  if (!valueResult.type) {
    const referencePath = buildReferencePath(context.documentPath);
    consola.warn(
      `Failed to process additionalProperties-only schema: ${referencePath}`,
    );
    return {
      type: undefined,
      models: [],
    };
  }

  return {
    type: valueResult.type as AdditionalPropertiesTraversalResult["type"],
    models: valueResult.models as AdditionalPropertiesTraversalResult["models"],
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("traverseMapValue", () => {
    it("should traverse map value with primitive type", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "string",
        models: [],
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
        models: [],
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
        type: { kind: "ref", name: "#/components/schemas/ArrayMapValue" },
        models: [
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
        name: "#/components/schemas/ArrayMapValue",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0].kind).toBe("array");
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
        models: [],
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
        models: [],
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
        models: [],
      });
      expect(mockVisitSchema).not.toHaveBeenCalled();
    });

    it("should warn when value type resolution fails", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: null,
        models: [],
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
        models: [],
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "Failed to process additionalProperties-only schema: #/components/schemas/FailedMap",
      );

      warnSpy.mockRestore();
    });
  });
}
