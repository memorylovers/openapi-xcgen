import {
  isAdditionalPropertiesContext,
  isCompositionContext,
  isParameterContext,
  isPathsRequestBodyContext,
  isPathsResponseContext,
  isRequestBodyContext,
  isResponseContext,
} from "../../../types/guards";
import type {
  AllOfContext,
  AnyOfContext,
  ComponentsRequestBodyContext,
  ComponentsResponseContext,
  OneOfContext,
  ParameterContext,
  RequestBodyContext,
  ResponseContext,
  VisitorContext,
} from "../../types";
import { buildParameterComponentName } from "./build-parameter-component-name";
import { buildRequestBodyComponentName } from "./build-request-body-component-name";
import { buildResponseComponentName } from "./build-response-component-name";

/**
 * VisitorContextからコンポーネント名を取得（中央ディスパッチャー）
 *
 * コンテキストの種類に応じて適切なビルダー関数を呼び出します。
 *
 * @param context - Visitorコンテキスト
 * @returns コンポーネント名
 *
 * @example
 * ```typescript
 * // ParameterContext
 * const paramCtx: ParameterContext = {
 *   method: "get",
 *   pathTemplate: "/users",
 *   parameterName: "limit",
 *   ...
 * };
 * getComponentName(paramCtx); // => "GetUsersParams"
 *
 * // AllOfContext
 * const allOfCtx: AllOfContext = {
 *   kind: "allOf",
 *   parentSchemaName: "Extended",
 *   index: 0,
 *   ...
 * };
 * getComponentName(allOfCtx); // => "ExtendedAllOf0"
 *
 * // 通常のコンテキスト
 * const ctx: VisitorContext = {
 *   documentPath: ["components", "schemas", "User"],
 *   rootSegment: "components",
 * };
 * getComponentName(ctx); // => "User"
 * ```
 */
export function getComponentName(context: VisitorContext): string {
  // paths配下のParameter
  if (isParameterContext(context)) {
    return buildParameterComponentName(context);
  }

  // paths配下のResponse
  if (isResponseContext(context)) {
    if (isPathsResponseContext(context)) {
      return buildResponseComponentName(context);
    }
    // components.responsesの場合はコンポーネント名(documentPath[2])を返す
    // 例: ["components", "responses", "BadRequest", "content", "application/json", "schema"]
    //      [0]          [1]          [2] ← これ
    return context.documentPath[2] ?? "";
  }

  // paths配下のRequestBody
  if (isRequestBodyContext(context)) {
    if (isPathsRequestBodyContext(context)) {
      return buildRequestBodyComponentName(context);
    }
    // components.requestBodiesの場合はコンポーネント名(documentPath[2])を返す
    // 例: ["components", "requestBodies", "UserArray", "content", "application/json", "schema"]
    //      [0]          [1]               [2] ← これ
    return context.documentPath[2] ?? "";
  }

  // Composition型（allOf/oneOf/anyOf）
  // documentPathに直接モデル名が含まれているため、最後の要素を返す
  if (isCompositionContext(context)) {
    return context.documentPath.at(-1) ?? "";
  }

  // AdditionalProperties
  // documentPathに直接モデル名が含まれているため、最後の要素を返す
  if (isAdditionalPropertiesContext(context)) {
    return context.documentPath.at(-1) ?? "";
  }

  // components配下の通常スキーマ
  return context.documentPath.at(-1) ?? "";
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("getComponentName", () => {
    describe("Paths contexts", () => {
      it("should generate name for ParameterContext", () => {
        const context: ParameterContext = {
          kind: "parameter",
          documentPath: ["paths", "/users", "get", "parameters"],
          rootSegment: "paths",
          parameterName: "limit",
          in: "query",
        };
        expect(getComponentName(context)).toBe("GetUsersParams");
      });

      it("should generate name for ParameterContext with path params", () => {
        const context: ParameterContext = {
          kind: "parameter",
          documentPath: ["paths", "/users/{id}", "get", "parameters"],
          rootSegment: "paths",
          parameterName: "id",
          in: "path",
        };
        expect(getComponentName(context)).toBe("GetUsersIdParams");
      });

      it("should generate name for RequestBodyContext", () => {
        const context: RequestBodyContext = {
          kind: "requestBody",
          documentPath: ["paths", "/users", "post", "requestBody"],
          rootSegment: "paths",
          contentType: "application/json",
          schemaPath: ["content", "application/json", "schema"],
        };
        expect(getComponentName(context)).toBe("PostUsersRequestBody");
      });

      it("should generate name for RequestBodyContext with media type suffix", () => {
        const context: RequestBodyContext = {
          kind: "requestBody",
          documentPath: ["paths", "/files", "post", "requestBody"],
          rootSegment: "paths",
          contentType: "multipart/form-data",
          schemaPath: ["content", "multipart/form-data", "schema"],
        };
        expect(getComponentName(context)).toBe(
          "PostFilesMultipartFormDataRequestBody",
        );
      });

      it("should generate name for ResponseContext", () => {
        const context: ResponseContext = {
          kind: "response",
          documentPath: ["paths", "/users", "get", "responses", "200"],
          rootSegment: "paths",
          contentType: "application/json",
          schemaPath: ["content", "application/json", "schema"],
        };
        expect(getComponentName(context)).toBe("GetUsers200Response");
      });

      it("should generate name for ResponseContext with different status code", () => {
        const context: ResponseContext = {
          kind: "response",
          documentPath: ["paths", "/users/{id}", "get", "responses", "404"],
          rootSegment: "paths",
          contentType: "application/json",
          schemaPath: ["content", "application/json", "schema"],
        };
        expect(getComponentName(context)).toBe("GetUsersId404Response");
      });
    });

    describe("Components contexts", () => {
      it("should extract component name for components.responses inline schema", () => {
        const context: ComponentsResponseContext = {
          kind: "componentsResponse",
          documentPath: [
            "components",
            "responses",
            "BadRequest",
            "content",
            "application/json",
            "schema",
          ],
          rootSegment: "components",
          contentType: "application/json",
          schemaPath: ["content", "application/json", "schema"],
        };
        expect(getComponentName(context)).toBe("BadRequest");
      });

      it("should extract component name for components.responses with different name", () => {
        const context: ComponentsResponseContext = {
          kind: "componentsResponse",
          documentPath: [
            "components",
            "responses",
            "NotFound",
            "content",
            "application/json",
            "schema",
          ],
          rootSegment: "components",
          contentType: "application/json",
          schemaPath: ["content", "application/json", "schema"],
        };
        expect(getComponentName(context)).toBe("NotFound");
      });

      it("should extract component name for components.requestBodies inline schema", () => {
        const context: ComponentsRequestBodyContext = {
          kind: "componentsRequestBody",
          documentPath: [
            "components",
            "requestBodies",
            "UserArray",
            "content",
            "application/json",
            "schema",
          ],
          rootSegment: "components",
          contentType: "application/json",
          schemaPath: ["content", "application/json", "schema"],
        };
        expect(getComponentName(context)).toBe("UserArray");
      });

      it("should extract component name for components.requestBodies with different name", () => {
        const context: ComponentsRequestBodyContext = {
          kind: "componentsRequestBody",
          documentPath: [
            "components",
            "requestBodies",
            "CreateUserRequest",
            "content",
            "application/json",
            "schema",
          ],
          rootSegment: "components",
          contentType: "application/json",
          schemaPath: ["content", "application/json", "schema"],
        };
        expect(getComponentName(context)).toBe("CreateUserRequest");
      });
    });

    describe("Composition contexts", () => {
      it("should generate name for AllOfContext", () => {
        const context: AllOfContext = {
          kind: "allOf",
          documentPath: ["components", "schemas", "ExtendedAllOf0"],
          rootSegment: "components",
          parentSchemaName: "Extended",
          index: 0,
        };
        expect(getComponentName(context)).toBe("ExtendedAllOf0");
      });

      it("should generate name for OneOfContext", () => {
        const context: OneOfContext = {
          kind: "oneOf",
          documentPath: ["components", "schemas", "PetOneOf1"],
          rootSegment: "components",
          parentSchemaName: "Pet",
          index: 1,
        };
        expect(getComponentName(context)).toBe("PetOneOf1");
      });

      it("should generate name for AnyOfContext", () => {
        const context: AnyOfContext = {
          kind: "anyOf",
          documentPath: ["components", "schemas", "ItemAnyOf2"],
          rootSegment: "components",
          parentSchemaName: "Item",
          index: 2,
        };
        expect(getComponentName(context)).toBe("ItemAnyOf2");
      });
    });

    describe("Default contexts", () => {
      it("should extract name from documentPath for base context", () => {
        const context: VisitorContext = {
          documentPath: ["components", "schemas", "User"],
          rootSegment: "components",
        };
        expect(getComponentName(context)).toBe("User");
      });

      it("should extract name from documentPath for schema context", () => {
        const context: VisitorContext = {
          kind: "schema",
          documentPath: ["components", "schemas", "Product"],
          rootSegment: "components",
        };
        expect(getComponentName(context)).toBe("Product");
      });

      it("should handle empty documentPath", () => {
        const context: VisitorContext = {
          documentPath: [],
          rootSegment: "components",
        };
        expect(getComponentName(context)).toBe("");
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
        expect(getComponentName(context)).toBe("address");
      });
    });
  });
}
