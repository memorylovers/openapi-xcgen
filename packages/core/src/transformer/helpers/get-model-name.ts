import { pascalCase } from "es-toolkit/string";
import {
  isCompositionContext,
  isParameterContext,
  isPathsRequestBodyContext,
  isPathsResponseContext,
  isRequestBodyContext,
  isResponseContext,
} from "../../types/guards.js";
import type {
  AllOfContext,
  AnyOfContext,
  OneOfContext,
  ParameterContext,
  RequestBodyContext,
  ResponseContext,
  VisitorContext,
} from "../types.js";
import { buildInlineModelName } from "./build-model-name.js";
import { getMediaTypeSuffix } from "./media-type-suffix.js";

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
function pathToComponentBase(pathTemplate: string): string {
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
 * VisitorContextからモデル名を取得
 *
 * コンテキストの種類に応じて適切な命名戦略を適用します：
 * - paths配下のインラインスキーマ（Parameter/RequestBody/Response）: {Method}{Path}{Suffix}形式
 * - Composition型（allOf/oneOf/anyOf）: {ParentName}{Type}{Index}
 * - components配下の通常スキーマ: documentPathの最後の要素
 *
 * @param context - Visitorコンテキスト
 * @returns モデル名
 *
 * @example
 * ```typescript
 * // ParameterContext
 * const paramCtx: ParameterContext = {
 *   documentPath: ["paths", "/users", "get", "parameters"],
 *   rootSegment: "paths",
 *   method: "get",
 *   pathTemplate: "/users",
 *   parameterName: "limit",
 *   in: "query"
 * };
 * getModelName(paramCtx); // => "GetUsersParams"
 *
 * // AllOfContext
 * const allOfCtx: AllOfContext = {
 *   kind: "allOf",
 *   documentPath: ["components", "schemas", "Extended", "allOf", "0"],
 *   rootSegment: "components",
 *   parentSchemaName: "Extended",
 *   index: 0,
 * };
 * getModelName(allOfCtx); // => "ExtendedAllOf0"
 *
 * // 通常のコンテキスト
 * const ctx: VisitorContext = {
 *   documentPath: ["components", "schemas", "User"],
 *   rootSegment: "components",
 * };
 * getModelName(ctx); // => "User"
 * ```
 */
export function getModelName(context: VisitorContext): string {
  // paths配下のParameter
  if (isParameterContext(context)) {
    const methodPascal = pascalCase(context.method ?? "");
    const pathBase = pathToComponentBase(context.pathTemplate ?? "");
    return `${methodPascal}${pathBase}Params`;
  }

  // paths配下のResponse（RequestBodyより先にチェック、statusCodeがユニーク）
  if (isResponseContext(context)) {
    if (isPathsResponseContext(context)) {
      const methodPascal = pascalCase(context.method ?? "");
      const pathBase = pathToComponentBase(context.pathTemplate ?? "");
      const mediaSuffix = getMediaTypeSuffix(context.contentType ?? undefined);
      return `${methodPascal}${pathBase}${context.statusCode}${mediaSuffix}Response`;
    }
    // components.responsesの場合はdocumentPathの最後の要素を返す
    return context.documentPath.at(-1) ?? "";
  }

  // paths配下のRequestBody
  if (isRequestBodyContext(context)) {
    if (isPathsRequestBodyContext(context)) {
      const methodPascal = pascalCase(context.method ?? "");
      const pathBase = pathToComponentBase(context.pathTemplate ?? "");
      const mediaSuffix = getMediaTypeSuffix(context.contentType ?? undefined);
      return `${methodPascal}${pathBase}${mediaSuffix}RequestBody`;
    }
    // components.requestBodiesの場合はdocumentPathの最後の要素を返す
    return context.documentPath.at(-1) ?? "";
  }

  // Composition型（allOf/oneOf/anyOf）
  if (isCompositionContext(context)) {
    const ctx = context as AllOfContext | AnyOfContext | OneOfContext;
    return buildInlineModelName(ctx.parentSchemaName, ctx.kind, ctx.index);
  }

  // components配下の通常スキーマ
  return context.documentPath.at(-1) ?? "";
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

  describe("getModelName", () => {
    describe("Paths contexts", () => {
      it("should generate name for ParameterContext", () => {
        const context: ParameterContext = {
          kind: "parameter",
          documentPath: ["paths", "/users", "get", "parameters"],
          rootSegment: "paths",
          parameterName: "limit",
          in: "query",
          method: "get",
          pathTemplate: "/users",
        };
        expect(getModelName(context)).toBe("GetUsersParams");
      });

      it("should generate name for ParameterContext with path params", () => {
        const context: ParameterContext = {
          kind: "parameter",
          documentPath: ["paths", "/users/{id}", "get", "parameters"],
          rootSegment: "paths",
          parameterName: "id",
          in: "path",
          method: "get",
          pathTemplate: "/users/{id}",
        };
        expect(getModelName(context)).toBe("GetUsersIdParams");
      });

      it("should generate name for RequestBodyContext", () => {
        const context: RequestBodyContext = {
          kind: "requestBody",
          documentPath: ["paths", "/users", "post", "requestBody"],
          rootSegment: "paths",
          method: "post",
          pathTemplate: "/users",
          contentType: "application/json",
          schemaPath: ["content", "application/json", "schema"],
        };
        expect(getModelName(context)).toBe("PostUsersRequestBody");
      });

      it("should generate name for RequestBodyContext with media type suffix", () => {
        const context: RequestBodyContext = {
          kind: "requestBody",
          documentPath: ["paths", "/files", "post", "requestBody"],
          rootSegment: "paths",
          method: "post",
          pathTemplate: "/files",
          contentType: "multipart/form-data",
          schemaPath: ["content", "multipart/form-data", "schema"],
        };
        expect(getModelName(context)).toBe(
          "PostFilesMultipartFormDataRequestBody",
        );
      });

      it("should generate name for ResponseContext", () => {
        const context: ResponseContext = {
          kind: "response",
          documentPath: ["paths", "/users", "get", "responses", "200"],
          rootSegment: "paths",
          method: "get",
          pathTemplate: "/users",
          statusCode: "200",
          contentType: "application/json",
          schemaPath: ["content", "application/json", "schema"],
        };
        expect(getModelName(context)).toBe("GetUsers200Response");
      });

      it("should generate name for ResponseContext with different status code", () => {
        const context: ResponseContext = {
          kind: "response",
          documentPath: ["paths", "/users/{id}", "get", "responses", "404"],
          rootSegment: "paths",
          method: "get",
          pathTemplate: "/users/{id}",
          statusCode: "404",
          contentType: "application/json",
          schemaPath: ["content", "application/json", "schema"],
        };
        expect(getModelName(context)).toBe("GetUsersId404Response");
      });
    });

    describe("Composition contexts", () => {
      it("should generate name for AllOfContext", () => {
        const context: AllOfContext = {
          kind: "allOf",
          documentPath: ["components", "schemas", "Extended", "allOf", "0"],
          rootSegment: "components",
          parentSchemaName: "Extended",
          index: 0,
        };
        expect(getModelName(context)).toBe("ExtendedAllOf0");
      });

      it("should generate name for OneOfContext", () => {
        const context: OneOfContext = {
          kind: "oneOf",
          documentPath: ["components", "schemas", "Pet", "oneOf", "1"],
          rootSegment: "components",
          parentSchemaName: "Pet",
          index: 1,
        };
        expect(getModelName(context)).toBe("PetOneOf1");
      });

      it("should generate name for AnyOfContext", () => {
        const context: AnyOfContext = {
          kind: "anyOf",
          documentPath: ["components", "schemas", "Item", "anyOf", "2"],
          rootSegment: "components",
          parentSchemaName: "Item",
          index: 2,
        };
        expect(getModelName(context)).toBe("ItemAnyOf2");
      });
    });

    describe("Default contexts", () => {
      it("should extract name from documentPath for base context", () => {
        const context: VisitorContext = {
          documentPath: ["components", "schemas", "User"],
          rootSegment: "components",
        };
        expect(getModelName(context)).toBe("User");
      });

      it("should extract name from documentPath for schema context", () => {
        const context: VisitorContext = {
          kind: "schema",
          documentPath: ["components", "schemas", "Product"],
          rootSegment: "components",
        };
        expect(getModelName(context)).toBe("Product");
      });

      it("should handle empty documentPath", () => {
        const context: VisitorContext = {
          documentPath: [],
          rootSegment: "components",
        };
        expect(getModelName(context)).toBe("");
      });

      it("should handle nested paths", () => {
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
        expect(getModelName(context)).toBe("address");
      });
    });
  });
}
