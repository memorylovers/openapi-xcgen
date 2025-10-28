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
  OneOfContext,
  ParameterContext,
  RequestBodyContext,
  ResponseContext,
  VisitorContext,
} from "../../types";
import { buildParameterModelName } from "./build-parameter-model-name";
import { buildRequestBodyModelName } from "./build-request-body-model-name";
import { buildResponseModelName } from "./build-response-model-name";

/**
 * VisitorContextからモデル名を取得（中央ディスパッチャー）
 *
 * コンテキストの種類に応じて適切なビルダー関数を呼び出します。
 *
 * @param context - Visitorコンテキスト
 * @returns モデル名
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
 * getModelName(paramCtx); // => "GetUsersParams"
 *
 * // AllOfContext
 * const allOfCtx: AllOfContext = {
 *   kind: "allOf",
 *   parentSchemaName: "Extended",
 *   index: 0,
 *   ...
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
    return buildParameterModelName(context);
  }

  // paths配下のResponse
  if (isResponseContext(context)) {
    if (isPathsResponseContext(context)) {
      return buildResponseModelName(context);
    }
    // components.responsesの場合はdocumentPathの最後の要素を返す
    return context.documentPath.at(-1) ?? "";
  }

  // paths配下のRequestBody
  if (isRequestBodyContext(context)) {
    if (isPathsRequestBodyContext(context)) {
      return buildRequestBodyModelName(context);
    }
    // components.requestBodiesの場合はdocumentPathの最後の要素を返す
    return context.documentPath.at(-1) ?? "";
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

  describe("getModelName", () => {
    describe("Paths contexts", () => {
      it("should generate name for ParameterContext", () => {
        const context: ParameterContext = {
          kind: "parameter",
          documentPath: ["paths", "/users", "get", "parameters"],
          rootSegment: "paths",
          parameterName: "limit",
          in: "query",
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
        };
        expect(getModelName(context)).toBe("GetUsersIdParams");
      });

      it("should generate name for RequestBodyContext", () => {
        const context: RequestBodyContext = {
          kind: "requestBody",
          documentPath: ["paths", "/users", "post", "requestBody"],
          rootSegment: "paths",
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
          documentPath: ["components", "schemas", "ExtendedAllOf0"],
          rootSegment: "components",
          parentSchemaName: "Extended",
          index: 0,
        };
        expect(getModelName(context)).toBe("ExtendedAllOf0");
      });

      it("should generate name for OneOfContext", () => {
        const context: OneOfContext = {
          kind: "oneOf",
          documentPath: ["components", "schemas", "PetOneOf1"],
          rootSegment: "components",
          parentSchemaName: "Pet",
          index: 1,
        };
        expect(getModelName(context)).toBe("PetOneOf1");
      });

      it("should generate name for AnyOfContext", () => {
        const context: AnyOfContext = {
          kind: "anyOf",
          documentPath: ["components", "schemas", "ItemAnyOf2"],
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
