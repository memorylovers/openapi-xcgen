/**
 * インラインスキーマ用のdocumentPathを構築
 *
 * 設計原則:
 * - 親パスの末尾にモデル名を追記する（置換ではない）
 * - これにより実際のYAML構造が完全に保持され、デバッグが容易になる
 * - referencePath.split('/').pop() === modelName も引き続き保証される
 */

import type { VisitorContext } from "../../types";

/**
 * インラインスキーマ用のdocumentPathを構築
 *
 * 設計原則:
 * - 親パスの末尾にモデル名を追記する（置換ではない）
 * - これにより実際のYAML構造が完全に保持され、デバッグが容易になる
 * - referencePath.split('/').pop() === modelName も引き続き保証される
 *
 * @param parentContext - 親Visitorコンテキスト
 * @param inlineModelName - インラインスキーマのモデル名
 * @returns documentPath配列
 *
 * @example
 * ```typescript
 * // object-visitor: ネストしたプロパティ
 * // parentContext.documentPath = ["components", "schemas", "User", "properties", "address"]
 * buildInlineSchemaPath(parentContext, "UserAddress")
 * // → ["components", "schemas", "User", "properties", "address", "UserAddress"]
 * // → referencePath: "#/components/schemas/User/properties/address/UserAddress"
 * // → name: "UserAddress" ✅一致（実際のYAML階層も保持）
 *
 * // allOf-visitor: インラインスキーマ
 * // parentContext.documentPath = ["components", "schemas", "Extended", "allOf", "1"]
 * buildInlineSchemaPath(parentContext, "ExtendedAllOf1")
 * // → ["components", "schemas", "Extended", "allOf", "1", "ExtendedAllOf1"]
 * // → referencePath: "#/components/schemas/Extended/allOf/1/ExtendedAllOf1"
 * // → name: "ExtendedAllOf1" ✅一致（allOf[1]の位置情報も保持）
 *
 * // requestBody: インラインスキーマ
 * // parentContext.documentPath = ["paths", "/users", "post", "requestBody", "content", "application/json", "schema"]
 * buildInlineSchemaPath(parentContext, "PostUsersRequestBody")
 * // → ["paths", "/users", "post", "requestBody", "content", "application/json", "schema", "PostUsersRequestBody"]
 * // → referencePath: "#/paths/::users/post/requestBody/content/application::json/schema/PostUsersRequestBody"
 * // → name: "PostUsersRequestBody" ✅一致（完全なYAML構造を保持）
 * ```
 */
export function buildInlineSchemaPath(
  parentContext: VisitorContext,
  inlineModelName: string,
): string[] {
  // 親コンテキストのパスの末尾にモデル名を追記（YAML構造を保持）
  return [...parentContext.documentPath, inlineModelName];
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildInlineSchemaPath", () => {
    it("should append inline name to parent path for object property", () => {
      const context: VisitorContext = {
        documentPath: [
          "components",
          "schemas",
          "User",
          "properties",
          "address",
        ],
        rootSegment: "components",
      };
      const result = buildInlineSchemaPath(context, "UserAddress");
      expect(result).toEqual([
        "components",
        "schemas",
        "User",
        "properties",
        "address",
        "UserAddress",
      ]);
    });

    it("should work with allOf inline schema", () => {
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Extended", "allOf", "1"],
        rootSegment: "components",
      };
      const result = buildInlineSchemaPath(context, "ExtendedAllOf1");
      expect(result).toEqual([
        "components",
        "schemas",
        "Extended",
        "allOf",
        "1",
        "ExtendedAllOf1",
      ]);
    });

    it("should work with anyOf inline schema", () => {
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Fruit", "anyOf", "0"],
        rootSegment: "components",
      };
      const result = buildInlineSchemaPath(context, "FruitAnyOf0");
      expect(result).toEqual([
        "components",
        "schemas",
        "Fruit",
        "anyOf",
        "0",
        "FruitAnyOf0",
      ]);
    });

    it("should work with nested paths", () => {
      const context: VisitorContext = {
        documentPath: [
          "paths",
          "/users",
          "post",
          "requestBody",
          "content",
          "application/json",
          "schema",
        ],
        rootSegment: "paths",
      };
      const result = buildInlineSchemaPath(context, "PostUsersRequestBody");
      expect(result).toEqual([
        "paths",
        "/users",
        "post",
        "requestBody",
        "content",
        "application/json",
        "schema",
        "PostUsersRequestBody",
      ]);
    });
  });
}
