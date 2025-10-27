/**
 * インラインスキーマ用のdocumentPathを構築
 *
 * 設計原則:
 * - 親パスの最後の要素を新しいモデル名に置き換える
 * - これにより referencePath.split('/').pop() === modelName が保証される
 */

import type { VisitorContext } from "../../types";

/**
 * インラインスキーマ用のdocumentPathを構築
 *
 * 設計原則:
 * - 親パスの最後の要素を新しいモデル名に置き換える
 * - これにより referencePath.split('/').pop() === modelName が保証される
 *
 * @param parentContext - 親Visitorコンテキスト
 * @param inlineModelName - インラインスキーマのモデル名
 * @returns documentPath配列
 *
 * @example
 * ```typescript
 * // object-visitor: ネストしたプロパティ
 * // parentContext.documentPath = ["components", "schemas", "User"]
 * buildInlineSchemaPath(parentContext, "UserAddress")
 * // → ["components", "schemas", "UserAddress"]
 * // → referencePath: "#/components/schemas/UserAddress"
 * // → name: "UserAddress" ✅一致
 *
 * // allOf-visitor: インラインスキーマ
 * // parentContext.documentPath = ["components", "schemas", "Extended"]
 * buildInlineSchemaPath(parentContext, "ExtendedAllOf1")
 * // → ["components", "schemas", "ExtendedAllOf1"]
 * // → referencePath: "#/components/schemas/ExtendedAllOf1"
 * // → name: "ExtendedAllOf1" ✅一致
 *
 * // anyOf-visitor: インラインスキーマ
 * // parentContext.documentPath = ["components", "schemas", "Fruit"]
 * buildInlineSchemaPath(parentContext, "FruitAnyOf0")
 * // → ["components", "schemas", "FruitAnyOf0"]
 * // → referencePath: "#/components/schemas/FruitAnyOf0"
 * // → name: "FruitAnyOf0" ✅一致
 * ```
 */
export function buildInlineSchemaPath(
  parentContext: VisitorContext,
  inlineModelName: string,
): string[] {
  // 親コンテキストのパスから最後の要素を除き、新しいモデル名に置き換え
  return [...parentContext.documentPath.slice(0, -1), inlineModelName];
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildInlineSchemaPath", () => {
    it("should replace parent name with inline name for object property", () => {
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "User"],
        rootSegment: "components",
      };
      const result = buildInlineSchemaPath(context, "UserAddress");
      expect(result).toEqual(["components", "schemas", "UserAddress"]);
    });

    it("should work with allOf inline schema", () => {
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Extended"],
        rootSegment: "components",
      };
      const result = buildInlineSchemaPath(context, "ExtendedAllOf1");
      expect(result).toEqual(["components", "schemas", "ExtendedAllOf1"]);
    });

    it("should work with anyOf inline schema", () => {
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Fruit"],
        rootSegment: "components",
      };
      const result = buildInlineSchemaPath(context, "FruitAnyOf0");
      expect(result).toEqual(["components", "schemas", "FruitAnyOf0"]);
    });

    it("should work with nested paths", () => {
      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post", "requestBody", "content"],
        rootSegment: "paths",
      };
      const result = buildInlineSchemaPath(context, "PostUsersRequestBody");
      expect(result).toEqual([
        "paths",
        "/users",
        "post",
        "requestBody",
        "PostUsersRequestBody",
      ]);
    });
  });
}
