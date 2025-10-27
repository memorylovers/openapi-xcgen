/**
 * referencePath生成ヘルパー
 */

/**
 * documentPathからreferencePathを生成
 * @param documentPath - OpenAPIドキュメント内のパス配列
 * @returns 生成されたreferencePath
 *
 * @example
 * ```typescript
 * // component定義の場合
 * buildReferencePath(["components", "schemas", "User"])
 * // => "#/components/schemas/User"
 *
 * // インライン定義の場合（将来実装）
 * buildReferencePath(["paths", "/users", "get", "responses", "200"])
 * // => "#/paths/::users/get/responses/200"
 * ```
 */
export function buildReferencePath(documentPath: string[]): string {
  if (documentPath.length === 0) {
    return "#";
  }

  // pathsの場合、エンドポイントパスを::記法に変換
  if (documentPath[0] === "paths" && documentPath.length >= 2) {
    const endpointPath = documentPath[1]; // e.g., "/users"
    const convertedPath = convertPathToEndpointNotation(endpointPath);
    const restPath = documentPath.slice(2);

    if (restPath.length > 0) {
      // restPath内でスラッシュを含むセグメント（MIMEタイプなど）も::でエンコード
      const encodedRestPath = restPath.map((segment) => {
        if (segment.includes("/")) {
          return segment.replace(/\//g, "::");
        }
        return segment;
      });
      return `#/paths/${convertedPath}/${encodedRestPath.join("/")}`;
    }
    return `#/paths/${convertedPath}`;
  }

  // それ以外（components等）はそのまま結合
  return `#/${documentPath.join("/")}`;
}

/**
 * パスを`::`記法に変換
 * @param path - 変換対象のパス
 * @returns `::`記法に変換されたパス
 *
 * @example
 * ```typescript
 * convertPathToEndpointNotation("/users/{id}")
 * // => "::users::{id}"
 *
 * convertPathToEndpointNotation("/api/v1/products")
 * // => "::api::v1::products"
 * ```
 */
function convertPathToEndpointNotation(path: string): string {
  // 先頭の/を削除し、残りの/を::に置換
  return "::" + path.slice(1).replace(/\//g, "::");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildReferencePath", () => {
    it("should generate component reference path", () => {
      const result = buildReferencePath(["components", "schemas", "User"]);
      expect(result).toBe("#/components/schemas/User");
    });

    it("should handle empty document path", () => {
      const result = buildReferencePath([]);
      expect(result).toBe("#");
    });

    it("should generate inline reference path for paths", () => {
      const result = buildReferencePath([
        "paths",
        "/users",
        "get",
        "responses",
        "200",
      ]);
      expect(result).toBe("#/paths/::users/get/responses/200");
    });

    it("should handle complex paths", () => {
      const result = buildReferencePath([
        "paths",
        "/api/v1/products",
        "post",
        "requestBody",
      ]);
      expect(result).toBe("#/paths/::api::v1::products/post/requestBody");
    });

    it("should handle path without additional segments", () => {
      const result = buildReferencePath(["paths", "/users"]);
      expect(result).toBe("#/paths/::users");
    });

    it("should handle other root paths", () => {
      const result = buildReferencePath(["info", "title"]);
      expect(result).toBe("#/info/title");
    });

    it("should encode MIME types in path segments", () => {
      const result = buildReferencePath([
        "paths",
        "/users",
        "post",
        "responses",
        "200",
        "content",
        "application/json",
        "schema",
      ]);
      expect(result).toBe(
        "#/paths/::users/post/responses/200/content/application::json/schema",
      );
    });

    it("should encode multiple MIME types", () => {
      const result = buildReferencePath([
        "paths",
        "/files",
        "post",
        "requestBody",
        "content",
        "multipart/form-data",
        "schema",
      ]);
      expect(result).toBe(
        "#/paths/::files/post/requestBody/content/multipart::form-data/schema",
      );
    });

    it("should handle mixed segments with and without slashes", () => {
      const result = buildReferencePath([
        "paths",
        "/api/v1/users",
        "get",
        "responses",
        "200",
        "content",
        "application/json",
        "schema",
        "properties",
        "data",
      ]);
      expect(result).toBe(
        "#/paths/::api::v1::users/get/responses/200/content/application::json/schema/properties/data",
      );
    });
  });

  describe("convertPathToEndpointNotation", () => {
    it("should convert simple path", () => {
      expect(convertPathToEndpointNotation("/users")).toBe("::users");
    });

    it("should convert path with parameter", () => {
      expect(convertPathToEndpointNotation("/users/{id}")).toBe(
        "::users::{id}",
      );
    });

    it("should convert nested path", () => {
      expect(convertPathToEndpointNotation("/api/v1/products")).toBe(
        "::api::v1::products",
      );
    });

    it("should handle complex path with multiple parameters", () => {
      expect(
        convertPathToEndpointNotation("/users/{userId}/posts/{postId}"),
      ).toBe("::users::{userId}::posts::{postId}");
    });
  });
}
