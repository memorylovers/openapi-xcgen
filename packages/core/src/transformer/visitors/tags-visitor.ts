/**
 * tags-visitor.ts - OpenAPIのtagsセクションを処理してIRTag[]に変換
 *
 * OpenAPIドキュメントのトップレベルのtagsセクションを処理し、
 * タグ定義をIRTagの配列に変換する。
 *
 * 責務:
 * - TagObject[]の処理
 * - IRTag[]の生成
 * - externalDocsの処理
 */

import type { TagObject } from "../../types";
import type { IRTag } from "../../types/ir";

/**
 * TagObject[]を処理してIRTag[]に変換
 *
 * @param tags - OpenAPIのタグ定義配列
 * @returns IRTag配列
 *
 * @example OpenAPI YAML
 * ```yaml
 * tags:
 *   - name: users
 *     description: User management operations
 *     externalDocs:
 *       url: https://example.com/docs/users
 *       description: User API documentation
 *   - name: pets
 *     description: Pet management operations
 * ```
 */
export function visitTags(tags: TagObject[] | undefined): IRTag[] {
  if (!tags || tags.length === 0) {
    return [];
  }

  return tags.map((tag) => ({
    name: tag.name,
    description: tag.description || null,
    externalDocs: tag.externalDocs
      ? {
          url: tag.externalDocs.url,
          description: tag.externalDocs.description || null,
        }
      : null,
  }));
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("visitTags", () => {
    it("should handle undefined tags", () => {
      const result = visitTags(undefined);
      expect(result).toEqual([]);
    });

    it("should handle empty tags array", () => {
      const result = visitTags([]);
      expect(result).toEqual([]);
    });

    it("should convert tags with description", () => {
      const tags: TagObject[] = [
        {
          name: "users",
          description: "User management operations",
        },
        {
          name: "pets",
          description: "Pet management operations",
        },
      ];

      const result = visitTags(tags);

      expect(result).toEqual([
        {
          name: "users",
          description: "User management operations",
          externalDocs: null,
        },
        {
          name: "pets",
          description: "Pet management operations",
          externalDocs: null,
        },
      ]);
    });

    it("should convert tags with externalDocs", () => {
      const tags: TagObject[] = [
        {
          name: "users",
          description: "User management operations",
          externalDocs: {
            url: "https://example.com/docs/users",
            description: "User API documentation",
          },
        },
      ];

      const result = visitTags(tags);

      expect(result).toEqual([
        {
          name: "users",
          description: "User management operations",
          externalDocs: {
            url: "https://example.com/docs/users",
            description: "User API documentation",
          },
        },
      ]);
    });

    it("should handle tags with minimal information", () => {
      const tags: TagObject[] = [
        {
          name: "minimal",
        },
      ];

      const result = visitTags(tags);

      expect(result).toEqual([
        {
          name: "minimal",
          description: null,
          externalDocs: null,
        },
      ]);
    });

    it("should handle externalDocs without description", () => {
      const tags: TagObject[] = [
        {
          name: "api",
          externalDocs: {
            url: "https://example.com/api",
          },
        },
      ];

      const result = visitTags(tags);

      expect(result).toEqual([
        {
          name: "api",
          description: null,
          externalDocs: {
            url: "https://example.com/api",
            description: null,
          },
        },
      ]);
    });
  });
}
