/**
 * Response Transformer - v2 Transformer Architecture
 *
 * ResponseObjectをIRResponseに変換します。
 * contentの処理はcontent-traverserに、headersの処理はheaders-traverserに委譲します。
 */

import type {
  IRRef,
  IRResponse,
  IRResponseContent,
  IRResponseHeader,
  ReferenceObject,
  ResponseObject,
} from "../../../types";
import { isReferenceObject } from "../../../types";
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
      // NOTE: IRResponseはIRTypeに含まれないが、Operation系の特別な型として扱う
      // TransformResultインターフェースは汎用的なため、型の妥協が必要
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: irResponse as any,
      models: [],
    };
  }

  // ResponseObjectとして処理
  const responseObj = response;

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
    // NOTE: IRResponseはIRTypeに含まれないが、Operation系の特別な型として扱う
    // TransformResultインターフェースは汎用的なため、型の妥協が必要
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: irResponse as any,
    models: childModels,
  };
}

/**
 * インラインobjectスキーマからIRResponseModelを生成
 *
 * 3層アーキテクチャに準拠: SchemaObject と PropertyTraversalResult を受け取り、
 * TransformResult を返します。
 *
 * @param schema - ObjectスキーマまたはSchemaObject
 * @param context - Visitorコンテキスト（kind: "response" または "componentsResponse"）
 * @param propertyTraversalResult - プロパティトラバーサル結果
 * @param additionalPropertiesResult - additionalPropertiesトラバーサル結果（オプション）
 * @returns TransformResult
 *
 * @example OpenAPI YAML
 * ```yaml
 * responses:
 *   '200':
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             result:
 *               type: string
 * # → GetUsers200Response model (kind: "response")
 * ```
 */
// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  type IRModel = import("../../../types").IRModel;

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseType = result.type as any as IRResponse;
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
}
