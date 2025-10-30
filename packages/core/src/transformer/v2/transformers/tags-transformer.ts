/**
 * tags-transformer.ts - TagObject[]をIRTag[]に変換
 *
 * 責務:
 * - TagObject[]の処理
 * - IRTag[]の生成
 * - externalDocsの処理
 */

import type { IRTag, TagObject } from "../../../types";

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
export function transformTags(tags: TagObject[] | undefined): IRTag[] {
  if (!tags || tags.length === 0) {
    return [];
  }

  return tags.map((tag) => ({
    name: tag.name,
    ...(tag.description && { description: tag.description }),
    ...(tag.externalDocs && {
      externalDocs: {
        url: tag.externalDocs.url,
        ...(tag.externalDocs.description && {
          description: tag.externalDocs.description,
        }),
      },
    }),
  }));
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("transformTags", () => {
    it("should handle undefined tags", () => {
      const result = transformTags(undefined);
      expect(result).toEqual([]);
    });

    it("should handle empty tags array", () => {
      const result = transformTags([]);
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

      const result = transformTags(tags);

      expect(result).toEqual([
        {
          name: "users",
          description: "User management operations",
        },
        {
          name: "pets",
          description: "Pet management operations",
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

      const result = transformTags(tags);

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

      const result = transformTags(tags);

      expect(result).toEqual([
        {
          name: "minimal",
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

      const result = transformTags(tags);

      expect(result).toEqual([
        {
          name: "api",
          externalDocs: {
            url: "https://example.com/api",
          },
        },
      ]);
    });
  });
}
