/**
 * Array Transformer - v2 Transformer Architecture
 *
 * 配列スキーマをIRArrayModelに変換します。
 * トラバーサル（items訪問）は array-traverser に委譲します。
 */

import type {
  IRArrayModel,
  ReferenceObject,
  SchemaObject,
} from "../../../types";
import { buildReferencePath, getModelName } from "../../helpers";
import type { VisitorContext } from "../../types";
import { createErrorResult } from "../errors";
import type { ArrayItemTraversalResult, TransformResult } from "../types";

/**
 * 配列スキーマをIRArrayModelに変換
 *
 * @param schema - 配列スキーマ
 * @param context - Visitorコンテキスト
 * @param traversalResult - トラバーサルから得られた要素型とモデル
 * @returns 変換結果
 *
 * @example OpenAPI YAML
 * ```yaml
 * Items:
 *   type: array
 *   items:
 *     type: string
 *   description: "List of items"
 * ```
 */
export function transformArray(
  schema: SchemaObject & {
    items?: SchemaObject | ReferenceObject;
  },
  context: VisitorContext,
  traversalResult: ArrayItemTraversalResult,
): TransformResult {
  const name = getModelName(context);
  const referencePath = buildReferencePath(context.documentPath);

  // トラバーサルが失敗した場合
  if (!traversalResult.itemType) {
    return createErrorResult(
      `Failed to resolve array item type: ${referencePath}`,
      "FAILED_ARRAY_ITEM_RESOLUTION",
      { referencePath, context },
    );
  }

  // IRArrayModelを作成
  const arrayModel: IRArrayModel = {
    kind: "array",
    name,
    referencePath,
    itemType: traversalResult.itemType,
    ...(schema.description && { description: schema.description }),
  };

  // 配列モデルと子要素から抽出されたモデルを返す
  return {
    type: { kind: "ref", name: referencePath },
    models: [arrayModel, ...traversalResult.models],
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("transformArray", () => {
    it("should create array model with primitive item type", () => {
      const schema: SchemaObject = {
        type: "array",
        items: { type: "string" },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Items"],
        rootSegment: "components",
      };

      const traversalResult: ArrayItemTraversalResult = {
        itemType: "string",
        models: [],
      };

      const result = transformArray(schema, context, traversalResult);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/Items",
      });
      expect(result.models).toEqual([
        {
          kind: "array",
          name: "Items",
          referencePath: "#/components/schemas/Items",
          itemType: "string",
        },
      ]);
    });

    it("should create array model with nested object item type", () => {
      const schema: SchemaObject = {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
          },
        },
        description: "List of blog posts",
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "BlogPosts"],
        rootSegment: "components",
      };

      const traversalResult: ArrayItemTraversalResult = {
        itemType: {
          kind: "ref",
          name: "#/components/schemas/BlogPostsItem",
        },
        models: [
          {
            kind: "object",
            name: "BlogPostsItem",
            referencePath: "#/components/schemas/BlogPostsItem",
            properties: [
              {
                name: "title",
                type: "string",
              },
            ],
          },
        ],
      };

      const result = transformArray(schema, context, traversalResult);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/BlogPosts",
      });
      expect(result.models).toHaveLength(2);
      expect(result.models[0]).toEqual({
        kind: "array",
        name: "BlogPosts",
        referencePath: "#/components/schemas/BlogPosts",
        itemType: {
          kind: "ref",
          name: "#/components/schemas/BlogPostsItem",
        },
        description: "List of blog posts",
      });
      expect(result.models[1].kind).toBe("object");
    });

    it("should return error result when item type resolution fails", () => {
      const schema: SchemaObject = {
        type: "array",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: { type: "invalid" } as any,
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "FailedArray"],
        rootSegment: "components",
      };

      const traversalResult: ArrayItemTraversalResult = {
        itemType: null,
        models: [],
      };

      const result = transformArray(schema, context, traversalResult);

      expect(result.type).toBeNull();
      expect(result.models).toEqual([]);
      expect(result.error?.code).toBe("FAILED_ARRAY_ITEM_RESOLUTION");
    });
  });
}
