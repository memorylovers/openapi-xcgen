/**
 * generate-component-name.ts - インラインスキーマのコンポーネント名生成
 *
 * OpenAPIのパス、HTTPメソッド、コンテキストから
 * 適切なコンポーネント名を生成する。
 *
 * 責務:
 * - パスからPascalCase名の生成
 * - HTTPメソッドとコンテキストに応じた接尾辞の付与
 * - 一貫性のある命名規則の適用
 */

import { pascalCase } from "es-toolkit/string";

/**
 * コンポーネント名生成のコンテキスト
 */
export type ComponentContext =
  | "requestBody"
  | "response"
  | "parameter"
  | "property";

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

/**
 * インラインスキーマのコンポーネント名を生成
 *
 * @param pathTemplate - OpenAPIパステンプレート（例: "/users/{userId}"）
 * @param method - HTTPメソッド（例: "get", "post"）
 * @param context - コンポーネントのコンテキスト
 * @param statusCode - レスポンスのステータスコード（responseコンテキストの場合）
 * @param propertyName - プロパティ名（propertyコンテキストの場合）
 * @returns 生成されたコンポーネント名
 *
 * @example
 * ```typescript
 * // リクエストボディ
 * generateComponentName("/users", "post", "requestBody")
 * // => "PostUsersRequestBody"
 *
 * // レスポンス
 * generateComponentName("/users/{userId}", "get", "response", "200")
 * // => "GetUsersUserId200Response"
 *
 * // レスポンス内のプロパティ
 * generateComponentName("/users", "get", "property", undefined, "data")
 * // => "GetUsersData"
 *
 * // パラメータ
 * generateComponentName("/users", "get", "parameter")
 * // => "GetUsersParams"
 * ```
 */
export function generateComponentName(
  pathTemplate: string,
  method: string,
  context: ComponentContext,
  statusCode?: string,
  propertyName?: string,
): string {
  const methodPascal = pascalCase(method);
  const pathBase = pathToComponentBase(pathTemplate);
  const base = `${methodPascal}${pathBase}`;

  switch (context) {
    case "requestBody":
      return `${base}RequestBody`;

    case "response":
      if (!statusCode) {
        throw new Error("Status code is required for response context");
      }
      return `${base}${statusCode}Response`;

    case "parameter":
      return `${base}Params`;

    case "property":
      if (!propertyName) {
        throw new Error("Property name is required for property context");
      }
      return `${base}${pascalCase(propertyName)}`;

    default:
      throw new Error(`Unknown context: ${context}`);
  }
}

/**
 * ネストしたプロパティのコンポーネント名を生成
 *
 * @param parentName - 親コンポーネント名（例: "PostUsersRequestBody"）
 * @param propertyName - プロパティ名（例: "profile"）
 * @returns ネストしたコンポーネント名（例: "PostUsersRequestBodyProfile"）
 */
export function generateNestedComponentName(
  parentName: string,
  propertyName: string,
): string {
  return `${parentName}${pascalCase(propertyName)}`;
}

/**
 * Enumのコンポーネント名を生成
 *
 * @param parentName - 親コンポーネント名（例: "GetUsers200Response"）
 * @param propertyName - プロパティ名（例: "status"）
 * @returns Enumコンポーネント名（例: "GetUsers200ResponseStatusEnum"）
 */
export function generateEnumComponentName(
  parentName: string,
  propertyName: string,
): string {
  return `${generateNestedComponentName(parentName, propertyName)}Enum`;
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

  describe("generateComponentName", () => {
    it("should generate request body names", () => {
      expect(generateComponentName("/users", "post", "requestBody")).toBe(
        "PostUsersRequestBody",
      );
      expect(
        generateComponentName("/users/{userId}", "put", "requestBody"),
      ).toBe("PutUsersUserIdRequestBody");
      expect(
        generateComponentName("/users/{userId}/posts", "post", "requestBody"),
      ).toBe("PostUsersUserIdPostsRequestBody");
    });

    it("should generate response names", () => {
      expect(generateComponentName("/users", "get", "response", "200")).toBe(
        "GetUsers200Response",
      );
      expect(
        generateComponentName("/users/{userId}", "get", "response", "404"),
      ).toBe("GetUsersUserId404Response");
      expect(
        generateComponentName(
          "/users/{userId}/posts/{postId}",
          "get",
          "response",
          "200",
        ),
      ).toBe("GetUsersUserIdPostsPostId200Response");
    });

    it("should generate parameter names", () => {
      expect(generateComponentName("/users", "get", "parameter")).toBe(
        "GetUsersParams",
      );
      expect(generateComponentName("/users/{userId}", "get", "parameter")).toBe(
        "GetUsersUserIdParams",
      );
    });

    it("should generate property names", () => {
      expect(
        generateComponentName("/users", "get", "property", undefined, "data"),
      ).toBe("GetUsersData");
      expect(
        generateComponentName(
          "/users",
          "post",
          "property",
          undefined,
          "profile",
        ),
      ).toBe("PostUsersProfile");
    });

    it("should throw error for response without status code", () => {
      expect(() => generateComponentName("/users", "get", "response")).toThrow(
        "Status code is required for response context",
      );
    });

    it("should throw error for property without property name", () => {
      expect(() => generateComponentName("/users", "get", "property")).toThrow(
        "Property name is required for property context",
      );
    });
  });

  describe("generateNestedComponentName", () => {
    it("should generate nested component names", () => {
      expect(
        generateNestedComponentName("PostUsersRequestBody", "profile"),
      ).toBe("PostUsersRequestBodyProfile");
      expect(generateNestedComponentName("GetUsers200Response", "data")).toBe(
        "GetUsers200ResponseData",
      );
      expect(
        generateNestedComponentName("PutUsersUserIdRequestBody", "settings"),
      ).toBe("PutUsersUserIdRequestBodySettings");
    });

    it("should handle hyphenated property names", () => {
      expect(
        generateNestedComponentName("PostUsersRequestBody", "user-profile"),
      ).toBe("PostUsersRequestBodyUserProfile");
    });
  });

  describe("generateEnumComponentName", () => {
    it("should generate enum component names", () => {
      expect(generateEnumComponentName("GetUsers200Response", "status")).toBe(
        "GetUsers200ResponseStatusEnum",
      );
      expect(generateEnumComponentName("PostUsersRequestBody", "role")).toBe(
        "PostUsersRequestBodyRoleEnum",
      );
      expect(generateEnumComponentName("GetUsersParams", "sort")).toBe(
        "GetUsersParamsSortEnum",
      );
    });
  });
}
