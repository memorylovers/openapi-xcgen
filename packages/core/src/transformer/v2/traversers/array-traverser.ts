/**
 * Array Traverser - v2 Transformer Architecture
 *
 * 配列スキーマの要素（items）を訪問し、子要素の型と抽出されたモデルを返します。
 * 変換処理は array-transformer に委譲します。
 */

import { consola } from "consola";
import type { ReferenceObject, SchemaObjectWithNullable } from "../../../types";
import { buildReferencePath, getModelName } from "../../helpers";
import type { VisitorContext } from "../../types";
import type { ArrayItemTraversalResult } from "../types";

/**
 * 配列要素を訪問するための関数型
 *
 * Phase 2では dispatchSchema がまだ実装されていないため、
 * visitSchema を受け取る高階関数として実装します。
 */
type VisitSchemaFn = (
  schema: SchemaObjectWithNullable | ReferenceObject,
  context: VisitorContext,
) => { type: unknown; models: unknown[] };

/**
 * 配列の items フィールドを訪問し、要素型と子モデルを返す
 *
 * @param schema - 配列スキーマ
 * @param context - 親コンテキスト
 * @param visitSchema - スキーマ訪問関数（再帰用）
 * @returns 配列要素のトラバーサル結果
 */
export function traverseArrayItem(
  schema: SchemaObjectWithNullable & {
    items?: SchemaObjectWithNullable | ReferenceObject;
  },
  context: VisitorContext,
  visitSchema: VisitSchemaFn,
): ArrayItemTraversalResult {
  // items フィールドのチェック
  if (!schema.items) {
    consola.warn(
      `Array schema without items: ${buildReferencePath(context.documentPath)}`,
    );
    return {
      itemType: null,
      models: [],
    };
  }

  // 配列要素用のコンテキストを構築
  const name = getModelName(context);
  const itemContext: VisitorContext = {
    documentPath: [...context.documentPath.slice(0, -1), `${name}Item`],
    rootSegment: context.rootSegment,
  };

  // 配列要素を再帰的に訪問
  const itemResult = visitSchema(schema.items, itemContext);

  if (!itemResult.type) {
    const referencePath = buildReferencePath(context.documentPath);
    consola.warn(`Failed to resolve array item type: ${referencePath}`);
    return {
      itemType: null,
      models: [],
    };
  }

  return {
    itemType: itemResult.type as ArrayItemTraversalResult["itemType"],
    models: itemResult.models as ArrayItemTraversalResult["models"],
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("traverseArrayItem", () => {
    it("should traverse array items with primitive type", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "string",
        models: [],
      });

      const schema = {
        type: "array" as const,
        items: { type: "string" as const },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Items"],
        rootSegment: "components",
      };

      const result = traverseArrayItem(schema, context, mockVisitSchema);

      expect(result).toEqual({
        itemType: "string",
        models: [],
      });

      expect(mockVisitSchema).toHaveBeenCalledWith(
        { type: "string" },
        {
          documentPath: ["components", "schemas", "ItemsItem"],
          rootSegment: "components",
        },
      );
    });

    it("should traverse array items with nested object", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: { kind: "ref", name: "#/components/schemas/BlogPostsItem" },
        models: [
          {
            kind: "object",
            name: "BlogPostsItem",
            referencePath: "#/components/schemas/BlogPostsItem",
            properties: [{ name: "title", type: "string" }],
          },
        ],
      });

      const schema = {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            title: { type: "string" as const },
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "BlogPosts"],
        rootSegment: "components",
      };

      const result = traverseArrayItem(schema, context, mockVisitSchema);

      expect(result.itemType).toEqual({
        kind: "ref",
        name: "#/components/schemas/BlogPostsItem",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0].kind).toBe("object");
    });

    it("should warn and return null when items are missing", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const mockVisitSchema = vi.fn();

      const schema = {
        type: "array" as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Missing"],
        rootSegment: "components",
      };

      const result = traverseArrayItem(schema, context, mockVisitSchema);

      expect(result).toEqual({
        itemType: null,
        models: [],
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "Array schema without items: #/components/schemas/Missing",
      );
      expect(mockVisitSchema).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it("should warn when item type resolution fails", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: null,
        models: [],
      });

      const schema = {
        type: "array" as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: { type: "invalid" as any },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "FailedArray"],
        rootSegment: "components",
      };

      const result = traverseArrayItem(schema, context, mockVisitSchema);

      expect(result).toEqual({
        itemType: null,
        models: [],
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "Failed to resolve array item type: #/components/schemas/FailedArray",
      );

      warnSpy.mockRestore();
    });
  });
}
