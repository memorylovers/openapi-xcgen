/**
 * Response Transformer - v2 Transformer Architecture
 *
 * ResponseObjectをIRResponseに変換します。
 * contentの処理はcontent-traverserに、headersの処理はheaders-traverserに委譲します。
 */

import type {
  IRModel,
  IRRef,
  IRResponse,
  IRResponseContent,
  IRResponseHeader,
  IRResponseModel,
  ReferenceObject,
  ResponseObject,
} from "../../../types";
import { isReferenceObject } from "../../../types";
import { buildReferencePath } from "../../helpers";
import type { VisitorContext } from "../../types";
import type {
  ContentTraversalResult,
  HeadersTraversalResult,
  TransformResult,
} from "../types";

/**
 * ResponseObjectをIRResponseに変換
 *
 * @param response - ResponseObjectまたはReferenceObject
 * @param statusCode - HTTPステータスコード（"200", "404", "default"など）
 * @param context - Visitorコンテキスト
 * @param contentResult - content-traverserからの結果（オプション）
 * @param headersResult - headers-traverserからの結果（オプション）
 * @returns 変換結果
 *
 * @example OpenAPI YAML
 * ```yaml
 * responses:
 *   '200':
 *     description: Success
 *     headers:
 *       X-Total-Count:
 *         schema:
 *           type: integer
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             result:
 *               type: string
 * ```
 */
export function transformResponse(
  response: ResponseObject | ReferenceObject,
  statusCode: string,
  context: VisitorContext,
  contentResult?: ContentTraversalResult,
  headersResult?: HeadersTraversalResult,
): TransformResult {
  // ReferenceObjectの場合
  if (isReferenceObject(response)) {
    const ref: IRRef = {
      kind: "ref",
      name: response.$ref,
    };

    const irResponse: IRResponse = {
      kind: "ref",
      statusCode,
      ref,
    };

    return {
      type: irResponse as unknown as TransformResult["type"],
      models: [],
    };
  }

  // ResponseObjectとして処理
  const responseObj = response as ResponseObject;

  // IRResponseContentに変換
  const irContent: IRResponseContent[] | undefined =
    contentResult && contentResult.content.length > 0
      ? contentResult.content.map((c) => ({
          mimeType: c.mimeType,
          schema: c.schema,
        }))
      : undefined;

  // IRResponseHeaderに変換
  const irHeaders: IRResponseHeader[] | undefined =
    headersResult && headersResult.headers.length > 0
      ? headersResult.headers.map((h) => ({
          name: h.name,
          type: h.type,
          ...(h.description && { description: h.description }),
          ...(h.defaultValue !== undefined && {
            defaultValue: h.defaultValue,
          }),
          ...(h.deprecated && { deprecated: true }),
        }))
      : undefined;

  // IRResponseを構築
  const irResponse: IRResponse = {
    kind: "content",
    statusCode,
    ...(responseObj.description && { description: responseObj.description }),
    ...(irContent && { content: irContent }),
    ...(irHeaders && { headers: irHeaders }),
  };

  // 子モデルを収集
  const childModels = [
    ...(contentResult?.childModels || []),
    ...(headersResult?.childModels || []),
  ];

  return {
    type: irResponse as unknown as TransformResult["type"],
    models: childModels,
  };
}

/**
 * インラインobjectスキーマからIRResponseModelを生成
 *
 * これは特別なケースで、Responseのcontentに直接objectスキーマがある場合に
 * IRResponseModelとして抽出します。
 *
 * @param properties - オブジェクトのプロパティ配列
 * @param statusCode - HTTPステータスコード
 * @param context - Visitorコンテキスト
 * @param description - 説明
 * @param headers - レスポンスヘッダー
 * @returns IRResponseModel
 *
 * @example OpenAPI YAML
 * ```yaml
 * responses:
 *   '200':
 *     description: Success
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             result:
 *               type: string
 * # → GetUsers200Response model
 * ```
 */
export function transformResponseObject(
  properties: Array<{
    name: string;
    type: unknown;
    required?: boolean;
    nullable?: boolean;
    description?: string;
  }>,
  statusCode: string,
  context: VisitorContext,
  description?: string,
  headers?: IRResponseHeader[],
): IRResponseModel {
  // モデル名を生成（最後のセグメントを使用）
  const modelName = context.documentPath[context.documentPath.length - 1];
  const referencePath = buildReferencePath(context.documentPath);

  const model: IRResponseModel = {
    kind: "response",
    name: modelName,
    referencePath,
    properties: properties as IRResponseModel["properties"],
    statusCode,
    ...(description && { description }),
    ...(headers && headers.length > 0 && { headers }),
  };

  return model;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("transformResponse", () => {
    it("should handle reference response", () => {
      const response = {
        $ref: "#/components/responses/SuccessResponse",
      } as ReferenceObject;

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      };

      const result = transformResponse(response, "200", context);

      expect(result.type).toEqual({
        kind: "ref",
        statusCode: "200",
        ref: {
          kind: "ref",
          name: "#/components/responses/SuccessResponse",
        },
      });
      expect(result.models).toEqual([]);
    });

    it("should handle response with content only", () => {
      const response: ResponseObject = {
        description: "Success",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                result: { type: "string" },
              },
            },
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      };

      const contentResult: ContentTraversalResult = {
        content: [
          {
            mimeType: "application/json",
            schema: {
              kind: "ref",
              name: "#/paths/::users/get/responses/200",
            },
          },
        ],
        childModels: [],
        requiresSpecialModel: false,
      };

      const result = transformResponse(response, "200", context, contentResult);

      expect(result.type).toEqual({
        kind: "content",
        statusCode: "200",
        description: "Success",
        content: [
          {
            mimeType: "application/json",
            schema: {
              kind: "ref",
              name: "#/paths/::users/get/responses/200",
            },
          },
        ],
      });
      expect(result.models).toEqual([]);
    });

    it("should handle response with headers", () => {
      const response: ResponseObject = {
        description: "Success",
        headers: {
          "X-Total-Count": {
            schema: { type: "integer" },
          },
        },
        content: {
          "application/json": {
            schema: { type: "array", items: { type: "string" } },
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      };

      const contentResult: ContentTraversalResult = {
        content: [
          {
            mimeType: "application/json",
            schema: { kind: "ref", name: "#/test" },
          },
        ],
        childModels: [],
        requiresSpecialModel: false,
      };

      const headersResult: HeadersTraversalResult = {
        headers: [
          {
            name: "X-Total-Count",
            type: "int",
            description: "Total count",
          },
        ],
        childModels: [],
      };

      const result = transformResponse(
        response,
        "200",
        context,
        contentResult,
        headersResult,
      );

      const responseType = result.type as unknown as IRResponse;
      expect(responseType.kind).toBe("content");
      if (responseType.kind === "content") {
        expect(responseType.headers).toHaveLength(1);
        expect(responseType.headers?.[0]).toEqual({
          name: "X-Total-Count",
          type: "int",
          description: "Total count",
        });
      }
    });

    it("should handle response without content", () => {
      const response: ResponseObject = {
        description: "No content",
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "delete", "responses", "204"],
        rootSegment: "paths",
      };

      const result = transformResponse(response, "204", context);

      expect(result.type).toEqual({
        kind: "content",
        statusCode: "204",
        description: "No content",
      });
      expect(result.models).toEqual([]);
    });

    it("should collect child models from content and headers", () => {
      const response: ResponseObject = {
        description: "Success",
        content: {
          "application/json": {
            schema: { type: "object" },
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      };

      const mockContentModel: IRModel = {
        kind: "object",
        name: "ContentModel",
        referencePath: "#/content",
        properties: [],
      };

      const mockHeaderModel: IRModel = {
        kind: "object",
        name: "HeaderModel",
        referencePath: "#/header",
        properties: [],
      };

      const contentResult: ContentTraversalResult = {
        content: [
          {
            mimeType: "application/json",
            schema: { kind: "ref", name: "#/content" },
          },
        ],
        childModels: [mockContentModel],
        requiresSpecialModel: false,
      };

      const headersResult: HeadersTraversalResult = {
        headers: [],
        childModels: [mockHeaderModel],
      };

      const result = transformResponse(
        response,
        "200",
        context,
        contentResult,
        headersResult,
      );

      expect(result.models).toHaveLength(2);
      expect(result.models).toContain(mockContentModel);
      expect(result.models).toContain(mockHeaderModel);
    });
  });

  describe("transformResponseObject", () => {
    it("should create IRResponseModel", () => {
      const properties = [
        { name: "result", type: "string", required: true },
        { name: "count", type: "int" },
      ];

      const context: VisitorContext = {
        documentPath: [
          "paths",
          "/users",
          "get",
          "responses",
          "200",
          "GetUsers200Response",
        ],
        rootSegment: "paths",
      };

      const result = transformResponseObject(
        properties,
        "200",
        context,
        "Success response",
      );

      expect(result).toEqual({
        kind: "response",
        name: "GetUsers200Response",
        referencePath: "#/paths/::users/get/responses/200/GetUsers200Response",
        properties: [
          { name: "result", type: "string", required: true },
          { name: "count", type: "int" },
        ],
        statusCode: "200",
        description: "Success response",
      });
    });

    it("should include headers in response model", () => {
      const properties = [{ name: "data", type: "string" }];

      const headers: IRResponseHeader[] = [
        {
          name: "X-Rate-Limit",
          type: "int",
        },
      ];

      const context: VisitorContext = {
        documentPath: [
          "paths",
          "/api",
          "get",
          "responses",
          "200",
          "ApiResponse",
        ],
        rootSegment: "paths",
      };

      const result = transformResponseObject(
        properties,
        "200",
        context,
        "API response",
        headers,
      );

      expect(result.headers).toHaveLength(1);
      expect(result.headers?.[0].name).toBe("X-Rate-Limit");
    });

    it("should handle response without description", () => {
      const properties = [{ name: "value", type: "string" }];

      const context: VisitorContext = {
        documentPath: [
          "paths",
          "/test",
          "get",
          "responses",
          "200",
          "TestResponse",
        ],
        rootSegment: "paths",
      };

      const result = transformResponseObject(properties, "200", context);

      expect(result.description).toBeUndefined();
      expect(result.headers).toBeUndefined();
    });
  });
}
