/**
 * エンドポイントのタグ別グループ化
 *
 * OpenAPIエンドポイントをtagsでグループ化する
 */

import type { IREndpoint } from "@openapi-xcgen/core";

/**
 * エンドポイントをタグ別にグループ化
 *
 * @param endpoints - エンドポイント配列
 * @returns タグ名をキーとするエンドポイント配列のマップ
 *
 * @example
 * ```typescript
 * const endpoints: IREndpoint[] = [
 *   { operationId: "getPet", tags: ["pets"], ... },
 *   { operationId: "getUser", tags: ["users"], ... },
 *   { operationId: "createPet", tags: ["pets"], ... }
 * ];
 * groupEndpointsByTag(endpoints);
 * // => {
 * //   "pets": [{ operationId: "getPet", ... }, { operationId: "createPet", ... }],
 * //   "users": [{ operationId: "getUser", ... }]
 * // }
 * ```
 */
export function groupEndpointsByTag(
  endpoints: IREndpoint[],
): Record<string, IREndpoint[]> {
  const groups: Record<string, IREndpoint[]> = {};

  for (const endpoint of endpoints) {
    const tag = endpoint.tags?.[0] || "default";
    if (!groups[tag]) {
      groups[tag] = [];
    }
    groups[tag].push(endpoint);
  }

  return groups;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("groupEndpointsByTag", () => {
    it("should group endpoints by first tag", () => {
      const endpoints: IREndpoint[] = [
        {
          path: "/pets",
          method: "get",
          operationId: "getPets",
          tags: ["pets"],
          parameters: [],
          responses: [],
        },
        {
          path: "/pets/{petId}",
          method: "get",
          operationId: "getPet",
          tags: ["pets"],
          parameters: [],
          responses: [],
        },
        {
          path: "/users",
          method: "get",
          operationId: "getUsers",
          tags: ["users"],
          parameters: [],
          responses: [],
        },
      ];

      const result = groupEndpointsByTag(endpoints);

      expect(Object.keys(result)).toEqual(["pets", "users"]);
      expect(result.pets).toHaveLength(2);
      expect(result.users).toHaveLength(1);
    });

    it("should use default tag for endpoints without tags", () => {
      const endpoints: IREndpoint[] = [
        {
          path: "/health",
          method: "get",
          operationId: "healthCheck",
          tags: [],
          parameters: [],
          responses: [],
        },
        {
          path: "/status",
          method: "get",
          operationId: "getStatus",
          tags: [],
          parameters: [],
          responses: [],
        },
      ];

      const result = groupEndpointsByTag(endpoints);

      expect(result.default).toHaveLength(2);
    });

    it("should use only first tag when multiple tags exist", () => {
      const endpoints: IREndpoint[] = [
        {
          path: "/pets",
          method: "post",
          operationId: "createPet",
          tags: ["pets", "animals", "create"],
          parameters: [],
          responses: [],
        },
      ];

      const result = groupEndpointsByTag(endpoints);

      expect(Object.keys(result)).toEqual(["pets"]);
      expect(result.pets).toHaveLength(1);
      expect(result.animals).toBeUndefined();
    });

    it("should handle empty endpoints array", () => {
      const endpoints: IREndpoint[] = [];

      const result = groupEndpointsByTag(endpoints);

      expect(Object.keys(result)).toEqual([]);
    });

    it("should handle mix of tagged and untagged endpoints", () => {
      const endpoints: IREndpoint[] = [
        {
          path: "/pets",
          method: "get",
          operationId: "getPets",
          tags: ["pets"],
          parameters: [],
          responses: [],
        },
        {
          path: "/health",
          method: "get",
          operationId: "healthCheck",
          tags: [],
          parameters: [],
          responses: [],
        },
      ];

      const result = groupEndpointsByTag(endpoints);

      expect(Object.keys(result).sort()).toEqual(["default", "pets"]);
      expect(result.pets).toHaveLength(1);
      expect(result.default).toHaveLength(1);
    });
  });
}
