/**
 * Map Transformer - v2 Transformer Architecture
 *
 * Map型スキーマ（additionalPropertiesのみ）をIRMapSchemaに変換します。
 * トラバーサル（値訪問）は map-traverser に委譲します。
 */

import type { IRMapSchema, SchemaObject } from "../../../types";
import {
  buildReferencePath,
  extractValidation,
  getComponentName,
} from "../../helpers";
import type { VisitorContext } from "../../types";
import { createErrorResult } from "../errors";
import type {
  AdditionalPropertiesTraversalResult,
  TransformResult,
} from "../types";

/**
 * Map型スキーマをIRMapSchemaに変換
 *
 * @param schema - Mapスキーマ
 * @param context - Visitorコンテキスト
 * @param traversalResult - トラバーサルから得られた値型とモデル
 * @returns 変換結果
 *
 * @example OpenAPI YAML
 * ```yaml
 * StringMap:
 *   type: object
 *   additionalProperties:
 *     type: string
 *   description: "Map of strings"
 * ```
 */
export function transformMap(
  schema: SchemaObject,
  context: VisitorContext,
  traversalResult: AdditionalPropertiesTraversalResult,
): TransformResult {
  const name = getComponentName(context);
  const referencePath = buildReferencePath(context.documentPath);

  // トラバーサルが失敗した場合（値型が undefined）
  if (!traversalResult.type) {
    return createErrorResult(
      `Failed to process additionalProperties-only schema: ${referencePath}`,
      "FAILED_MAP_VALUE_RESOLUTION",
      { referencePath, context },
    );
  }

  // バリデーション情報を抽出
  const validation = extractValidation(schema);

  // IRMapSchemaを作成
  const mapModel: IRMapSchema = {
    kind: "map",
    name,
    referencePath,
    valueType: traversalResult.type,
    ...(schema.description && { description: schema.description }),
    ...(validation && { validation }),
  };

  // Mapモデルと値から抽出されたモデルを返す
  return {
    type: { kind: "ref", referencePath: referencePath },
    components: [mapModel, ...traversalResult.components],
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("transformMap", () => {
    it("should create map model with primitive value type", () => {
      const schema: SchemaObject = {
        type: "object",
        additionalProperties: { type: "string" },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "StringMap"],
        rootSegment: "components",
      };

      const traversalResult: AdditionalPropertiesTraversalResult = {
        type: "string",
        components: [],
      };

      const result = transformMap(schema, context, traversalResult);

      expect(result.type).toEqual({
        kind: "ref",
        referencePath: "#/components/schemas/StringMap",
      });
      expect(result.components).toEqual([
        {
          kind: "map",
          name: "StringMap",
          referencePath: "#/components/schemas/StringMap",
          valueType: "string",
        },
      ]);
    });

    it("should create map model with complex value type", () => {
      const schema: SchemaObject = {
        type: "object",
        additionalProperties: {
          type: "array",
          items: { type: "string" },
        },
        description: "Map of string arrays",
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "ArrayMap"],
        rootSegment: "components",
      };

      const traversalResult: AdditionalPropertiesTraversalResult = {
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
      };

      const result = transformMap(schema, context, traversalResult);

      expect(result.type).toEqual({
        kind: "ref",
        referencePath: "#/components/schemas/ArrayMap",
      });
      expect(result.components).toHaveLength(2);
      expect(result.components[0]).toEqual({
        kind: "map",
        name: "ArrayMap",
        referencePath: "#/components/schemas/ArrayMap",
        valueType: {
          kind: "ref",
          referencePath: "#/components/schemas/ArrayMapValue",
        },
        description: "Map of string arrays",
      });
      expect(result.components[1].kind).toBe("array");
    });

    it("should return error result when value type is undefined", () => {
      const schema: SchemaObject = {
        type: "object",
        additionalProperties: true,
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "AnyMap"],
        rootSegment: "components",
      };

      const traversalResult: AdditionalPropertiesTraversalResult = {
        type: undefined,
        components: [],
      };

      const result = transformMap(schema, context, traversalResult);

      expect(result.type).toBeNull();
      expect(result.components).toEqual([]);
      expect(result.error?.code).toBe("FAILED_MAP_VALUE_RESOLUTION");
    });
  });
}
