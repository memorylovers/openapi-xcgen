/**
 * componentsスキーマ用のdocumentPathを構築
 *
 * 設計原則: referencePath.split('/').pop() === modelName
 * すべてのvisitorで統一的にdocumentPathを構築することで、
 * referencePathとmodelNameの整合性を保証する
 */

import type { VisitorContext } from "../types";

/**
 * componentsスキーマ用のdocumentPathを構築
 *
 * @param context - 親Visitorコンテキスト
 * @param schemaName - スキーマ名
 * @returns documentPath配列
 *
 * @example
 * ```typescript
 * // context.documentPath = ["components"]
 * buildComponentSchemaPath(context, "User")
 * // → ["components", "schemas", "User"]
 * // → referencePath: "#/components/schemas/User"
 * // → name: "User" ✅一致
 * ```
 */
export function buildComponentSchemaPath(
  context: VisitorContext,
  schemaName: string,
): string[] {
  return [...context.documentPath, "schemas", schemaName];
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildComponentSchemaPath", () => {
    it("should build path for component schema", () => {
      const context: VisitorContext = {
        documentPath: ["components"],
        rootSegment: "components",
      };
      const result = buildComponentSchemaPath(context, "User");
      expect(result).toEqual(["components", "schemas", "User"]);
    });

    it("should preserve existing path segments", () => {
      const context: VisitorContext = {
        documentPath: ["components"],
        rootSegment: "components",
      };
      const result = buildComponentSchemaPath(context, "Status");
      expect(result).toEqual(["components", "schemas", "Status"]);
    });
  });
}
