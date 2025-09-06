/**
 * convert-path-to-endpoint.ts - OpenAPIパスをエンドポイント記法に変換
 *
 * OpenAPIのパステンプレート（例: /users/{userId}/posts）を
 * エンドポイント記法（例: ::users::{userId}::posts）に変換する。
 *
 * 責務:
 * - パスセグメントの`::`区切りへの変換
 * - パスパラメータ（{param}）の保持
 * - 先頭スラッシュの除去
 */

/**
 * OpenAPIパステンプレートをエンドポイント記法に変換
 *
 * @param pathTemplate - OpenAPIのパステンプレート（例: "/users/{userId}/posts"）
 * @returns エンドポイント記法（例: "::users::{userId}::posts"）
 *
 * @example
 * ```typescript
 * convertPathToEndpoint("/users")
 * // => "::users"
 *
 * convertPathToEndpoint("/users/{userId}")
 * // => "::users::{userId}"
 *
 * convertPathToEndpoint("/users/{userId}/posts/{postId}")
 * // => "::users::{userId}::posts::{postId}"
 *
 * convertPathToEndpoint("/api/v2/products")
 * // => "::api::v2::products"
 * ```
 */
export function convertPathToEndpoint(pathTemplate: string): string {
  // 空またはルートパスの場合
  if (!pathTemplate || pathTemplate === "/") return "::";

  // スラッシュを`::`に置換
  return pathTemplate.replace(/\//g, "::");
}

/**
 * エンドポイント記法をOpenAPIパスに戻す
 *
 * @param endpointNotation - エンドポイント記法（例: "::users::{userId}::posts"）
 * @returns OpenAPIパス（例: "/users/{userId}/posts"）
 *
 * @example
 * ```typescript
 * convertEndpointToPath("::users")
 * // => "/users"
 *
 * convertEndpointToPath("::users::{userId}")
 * // => "/users/{userId}"
 *
 * convertEndpointToPath("::users::{userId}::posts::{postId}")
 * // => "/users/{userId}/posts/{postId}"
 * ```
 */
export function convertEndpointToPath(endpointNotation: string): string {
  // 空または`::`のみの場合はルートパス
  if (!endpointNotation || endpointNotation === "::") return "/";

  // `::`をスラッシュに置換
  return endpointNotation.replace(/::/g, "/");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("convertPathToEndpoint", () => {
    it("should convert simple path", () => {
      expect(convertPathToEndpoint("/users")).toBe("::users");
      expect(convertPathToEndpoint("/products")).toBe("::products");
    });

    it("should convert path with single parameter", () => {
      expect(convertPathToEndpoint("/users/{userId}")).toBe(
        "::users::{userId}",
      );
      expect(convertPathToEndpoint("/products/{id}")).toBe("::products::{id}");
    });

    it("should convert nested path with multiple parameters", () => {
      expect(convertPathToEndpoint("/users/{userId}/posts/{postId}")).toBe(
        "::users::{userId}::posts::{postId}",
      );
      expect(
        convertPathToEndpoint(
          "/orgs/{orgId}/teams/{teamId}/members/{memberId}",
        ),
      ).toBe("::orgs::{orgId}::teams::{teamId}::members::{memberId}");
    });

    it("should convert multi-segment path", () => {
      expect(convertPathToEndpoint("/api/v2/products")).toBe(
        "::api::v2::products",
      );
      expect(convertPathToEndpoint("/admin/settings/general")).toBe(
        "::admin::settings::general",
      );
    });

    it("should handle root path", () => {
      expect(convertPathToEndpoint("/")).toBe("::");
      expect(convertPathToEndpoint("")).toBe("::");
    });

    it("should handle path without leading slash", () => {
      // シンプルな実装では先頭スラッシュなしのパスはそのまま変換される
      expect(convertPathToEndpoint("users")).toBe("users");
      expect(convertPathToEndpoint("users/{userId}")).toBe("users::{userId}");
    });
  });

  describe("convertEndpointToPath", () => {
    it("should convert simple endpoint", () => {
      expect(convertEndpointToPath("::users")).toBe("/users");
      expect(convertEndpointToPath("::products")).toBe("/products");
    });

    it("should convert endpoint with single parameter", () => {
      expect(convertEndpointToPath("::users::{userId}")).toBe(
        "/users/{userId}",
      );
      expect(convertEndpointToPath("::products::{id}")).toBe("/products/{id}");
    });

    it("should convert nested endpoint with multiple parameters", () => {
      expect(convertEndpointToPath("::users::{userId}::posts::{postId}")).toBe(
        "/users/{userId}/posts/{postId}",
      );
      expect(
        convertEndpointToPath(
          "::orgs::{orgId}::teams::{teamId}::members::{memberId}",
        ),
      ).toBe("/orgs/{orgId}/teams/{teamId}/members/{memberId}");
    });

    it("should convert multi-segment endpoint", () => {
      expect(convertEndpointToPath("::api::v2::products")).toBe(
        "/api/v2/products",
      );
      expect(convertEndpointToPath("::admin::settings::general")).toBe(
        "/admin/settings/general",
      );
    });

    it("should handle root endpoint", () => {
      expect(convertEndpointToPath("::")).toBe("/");
      expect(convertEndpointToPath("")).toBe("/");
    });

    it("should handle endpoint without prefix", () => {
      // シンプルな実装では`::`プレフィックスなしのエンドポイントはそのまま変換される
      expect(convertEndpointToPath("users")).toBe("users");
      expect(convertEndpointToPath("users::{userId}")).toBe("users/{userId}");
    });
  });

  describe("round-trip conversion", () => {
    it("should maintain original path through round-trip", () => {
      const paths = [
        "/users",
        "/users/{userId}",
        "/users/{userId}/posts/{postId}",
        "/api/v2/products",
        "/admin/settings/general",
        "/",
      ];

      for (const path of paths) {
        const endpoint = convertPathToEndpoint(path);
        const restored = convertEndpointToPath(endpoint);
        expect(restored).toBe(path);
      }
    });
  });
}
