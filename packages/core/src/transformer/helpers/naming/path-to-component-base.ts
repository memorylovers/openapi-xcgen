/**
 * パステンプレートをコンポーネント名の基本部分に変換
 */

import { pascalCase } from "es-toolkit/string";

/**
 * パステンプレートをコンポーネント名の基本部分に変換
 *
 * @param pathTemplate - OpenAPIパステンプレート（例: "/users/{userId}/posts"）
 * @returns 基本コンポーネント名（例: "UsersUserIdPosts"）
 *
 * @example
 * ```typescript
 * pathToComponentBase("/users")
 * // => "Users"
 *
 * pathToComponentBase("/users/{userId}")
 * // => "UsersUserId"
 *
 * pathToComponentBase("/api/v2/products")
 * // => "ApiV2Products"
 * ```
 */
export function pathToComponentBase(pathTemplate: string): string {
  // 先頭のスラッシュを除去してセグメントに分割
  const segments = pathTemplate
    .replace(/^\//, "")
    .split("/")
    .filter((s) => s.length > 0);

  // 各セグメントをPascalCaseに変換して結合
  // パスパラメータの中括弧を除去してから変換
  return segments.map((s) => pascalCase(s.replace(/[{}]/g, ""))).join("");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("pathToComponentBase", () => {
    it("should convert simple paths", () => {
      expect(pathToComponentBase("/users")).toBe("Users");
      expect(pathToComponentBase("/products")).toBe("Products");
      expect(pathToComponentBase("/orders")).toBe("Orders");
    });

    it("should convert paths with parameters", () => {
      expect(pathToComponentBase("/users/{userId}")).toBe("UsersUserId");
      expect(pathToComponentBase("/products/{id}")).toBe("ProductsId");
      expect(pathToComponentBase("/orders/{orderId}/items/{itemId}")).toBe(
        "OrdersOrderIdItemsItemId",
      );
    });

    it("should convert multi-segment paths", () => {
      expect(pathToComponentBase("/api/v2/products")).toBe("ApiV2Products");
      expect(pathToComponentBase("/admin/settings/general")).toBe(
        "AdminSettingsGeneral",
      );
    });

    it("should handle hyphenated segments", () => {
      expect(pathToComponentBase("/api-keys")).toBe("ApiKeys");
      expect(pathToComponentBase("/user-profiles/{user-id}")).toBe(
        "UserProfilesUserId",
      );
    });

    it("should handle underscored segments", () => {
      expect(pathToComponentBase("/user_profiles")).toBe("UserProfiles");
      expect(pathToComponentBase("/api_v2/user_data")).toBe("ApiV2UserData");
    });
  });
}
