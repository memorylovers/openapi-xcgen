/**
 * AllOf Transformer - v2 Transformer Architecture
 *
 * allOfスキーマをIRAllOfModelに変換します。
 * トラバーサル（各サブスキーマ訪問）は composition-traverser に委譲します。
 */

import type { IRAllOfModel, SchemaObject } from "../../../types";
import { buildReferencePath, getModelName } from "../../helpers";
import type { VisitorContext } from "../../types";
import { createErrorResult } from "../errors";
import type { CompositionTraversalResult, TransformResult } from "../types";

/**
 * allOfスキーマをIRAllOfModelに変換
 *
 * @param schema - allOfスキーマ
 * @param context - Visitorコンテキスト
 * @param traversalResult - トラバーサルから得られたサブスキーマの型とモデル
 * @returns 変換結果
 *
 * @example OpenAPI YAML
 * ```yaml
 * Extended:
 *   allOf:
 *     - $ref: '#/components/schemas/Base'
 *     - type: object
 *       properties:
 *         extra:
 *           type: string
 *   description: "Extended model"
 * ```
 */
export function transformAllOf(
  schema: SchemaObject,
  context: VisitorContext,
  traversalResult: CompositionTraversalResult,
): TransformResult {
  const name = getModelName(context);
  const referencePath = buildReferencePath(context.documentPath);

  // 名前の妥当性チェック
  if (!name.trim()) {
    return createErrorResult(
      "Invalid allOf model name: empty or whitespace only",
      "INVALID_ALLOF_NAME",
      { context },
    );
  }

  // トラバーサルが失敗した場合（空配列）
  if (traversalResult.schemas.length === 0) {
    return createErrorResult(
      `Failed to resolve allOf schemas: ${referencePath}`,
      "FAILED_ALLOF_RESOLUTION",
      { referencePath, context },
    );
  }

  // IRAllOfModelを作成
  const allOfModel: IRAllOfModel = {
    kind: "allOf",
    name,
    referencePath,
    schemas: traversalResult.schemas,
    ...(schema.description && { description: schema.description }),
  };

  // allOfモデルと子要素から抽出されたモデルを返す
  return {
    type: { kind: "ref", name: referencePath },
    models: [allOfModel, ...traversalResult.childModels],
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("transformAllOf", () => {
    it("should create allOf model with multiple schemas", () => {
      const schema: SchemaObject = {
        allOf: [
          { $ref: "#/components/schemas/Base" },
          {
            type: "object",
            properties: {
              extra: { type: "string" },
            },
          },
        ],
        description: "Extended model",
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Extended"],
        rootSegment: "components",
      };

      const traversalResult: CompositionTraversalResult = {
        schemas: [
          { kind: "ref", name: "#/components/schemas/Base" },
          { kind: "ref", name: "#/components/schemas/ExtendedallOf1" },
        ],
        childModels: [
          {
            kind: "object",
            name: "Base",
            referencePath: "#/components/schemas/Base",
            properties: [{ name: "id", type: "string" }],
          },
          {
            kind: "object",
            name: "ExtendedallOf1",
            referencePath: "#/components/schemas/ExtendedallOf1",
            properties: [{ name: "extra", type: "string" }],
          },
        ],
      };

      const result = transformAllOf(schema, context, traversalResult);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/Extended",
      });
      expect(result.models).toHaveLength(3); // allOf + 2 child models
      expect(result.models[0]).toEqual({
        kind: "allOf",
        name: "Extended",
        referencePath: "#/components/schemas/Extended",
        schemas: [
          { kind: "ref", name: "#/components/schemas/Base" },
          { kind: "ref", name: "#/components/schemas/ExtendedallOf1" },
        ],
        description: "Extended model",
      });
    });

    it("should create allOf model without description", () => {
      const schema: SchemaObject = {
        allOf: [
          { type: "object", properties: { a: { type: "string" } } },
          { type: "object", properties: { b: { type: "number" } } },
        ],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Merged"],
        rootSegment: "components",
      };

      const traversalResult: CompositionTraversalResult = {
        schemas: [
          { kind: "ref", name: "#/components/schemas/MergedallOf0" },
          { kind: "ref", name: "#/components/schemas/MergedallOf1" },
        ],
        childModels: [],
      };

      const result = transformAllOf(schema, context, traversalResult);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/Merged",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0]).not.toHaveProperty("description");
    });

    it("should return error result when traversal fails", () => {
      const schema: SchemaObject = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allOf: [{ type: "invalid" }] as any,
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "FailedAllOf"],
        rootSegment: "components",
      };

      const traversalResult: CompositionTraversalResult = {
        schemas: [], // Empty = all failed
        childModels: [],
      };

      const result = transformAllOf(schema, context, traversalResult);

      expect(result.type).toBeNull();
      expect(result.models).toEqual([]);
      expect(result.error?.code).toBe("FAILED_ALLOF_RESOLUTION");
    });

    it("should return error result for empty model name", () => {
      const schema: SchemaObject = {
        allOf: [{ type: "string" }],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", ""],
        rootSegment: "components",
      };

      const traversalResult: CompositionTraversalResult = {
        schemas: ["string"],
        childModels: [],
      };

      const result = transformAllOf(schema, context, traversalResult);

      expect(result.type).toBeNull();
      expect(result.models).toEqual([]);
      expect(result.error?.code).toBe("INVALID_ALLOF_NAME");
    });
  });
}
