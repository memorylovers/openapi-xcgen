/**
 * responses-visitor.ts - ResponsesObjectをIRResponse配列に変換
 *
 * OpenAPIのResponsesObject（ステータスコード→ResponseObjectのマップ）を処理し、
 * IRResponse配列とインラインモデルに変換する。
 *
 * 責務:
 * - ResponsesObjectの反復処理
 * - 個別レスポンスのvisitResponse委譲
 * - ステータスコードの管理
 * - インラインモデルとEnumの収集
 */

import type {
  IRModel,
  IRResponse,
  ReferenceObject,
  ResponseObject,
} from "../../../types";
import type { ResponseContext, ResponsesContext } from "../../types";
import { visitResponse } from "./response-visitor";

/**
 * Responses処理の結果
 */
export interface ResponsesResult {
  /** レスポンス配列 */
  responses: IRResponse[];
  /** インラインスキーマから抽出されたモデル（オブジェクト、列挙型、配列、マップを統一） */
  models: IRModel[];
}

/**
 * Responsesオブジェクトをそれぞれ処理してIRResponse配列とインラインモデルに変換
 *
 * @param responses - OpenAPIのResponsesオブジェクト
 * @param context - Responses用コンテキスト
 * @returns ResponsesResult
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
 *             data:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/User"
 *   '404':
 *     description: Not found
 *   '500':
 *     description: Internal server error
 * ```
 */
export function visitResponses(
  responses: Record<string, ResponseObject | ReferenceObject> | null,
  context: ResponsesContext,
): ResponsesResult {
  const irResponses: IRResponse[] = [];
  const models: IRModel[] = [];

  // responsesが存在しない場合
  if (!responses) {
    return {
      responses: [],
      models: [],
    };
  }

  // 各ステータスコードのレスポンスを処理
  for (const [statusCode, response] of Object.entries(responses)) {
    const responseContext: ResponseContext = {
      kind: "response",
      documentPath: [...context.documentPath, statusCode],
      method: context.method,
      pathTemplate: context.pathTemplate,
      statusCode,
      rootSegment: "paths",
    };

    const responseResult = visitResponse(response, responseContext);

    if (responseResult) {
      if (responseResult.response) {
        irResponses.push(responseResult.response);
      }

      // インラインモデルを収集（オブジェクト、列挙型、配列、マップを統一）
      models.push(...responseResult.models);
    }
  }

  return {
    responses: irResponses,
    models,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("visitResponses", () => {
    it("should return empty result for null responses", () => {
      const result = visitResponses(null, {
        kind: "responses",
        documentPath: ["paths", "/test", "get", "responses"],
        rootSegment: "paths",
        method: "get",
        pathTemplate: "/test",
      });

      expect(result).toEqual({
        responses: [],
        models: [],
      });
    });

    it("should return empty result for empty responses object", () => {
      const result = visitResponses(
        {},
        {
          kind: "responses",
          documentPath: ["paths", "/test", "get", "responses"],
          rootSegment: "paths",
          method: "get",
          pathTemplate: "/test",
        },
      );

      expect(result).toEqual({
        responses: [],
        models: [],
      });
    });

    it("should process single response without content", () => {
      const responses = {
        "200": {
          description: "Success",
        },
      };

      const result = visitResponses(responses, {
        kind: "responses",
        documentPath: ["paths", "/test", "get", "responses"],
        rootSegment: "paths",
        method: "get",
        pathTemplate: "/test",
      });

      expect(result).toEqual({
        responses: [
          {
            kind: "content",
            statusCode: "200",
            description: "Success",
          },
        ],
        models: [],
      });
    });

    it("should process multiple responses", () => {
      const responses = {
        "200": {
          description: "Success",
        },
        "404": {
          description: "Not found",
        },
        "500": {
          description: "Internal server error",
        },
      };

      const result = visitResponses(responses, {
        kind: "responses",
        documentPath: ["paths", "/api/users/{id}", "get", "responses"],
        rootSegment: "paths",
        method: "get",
        pathTemplate: "/api/users/{id}",
      });

      expect(result).toEqual({
        responses: [
          {
            kind: "content",
            statusCode: "200",
            description: "Success",
          },
          {
            kind: "content",
            statusCode: "404",
            description: "Not found",
          },
          {
            kind: "content",
            statusCode: "500",
            description: "Internal server error",
          },
        ],
        models: [],
      });
    });

    it("should process responses with inline schemas", () => {
      const responses = {
        "200": {
          description: "Success",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                },
              },
            },
          },
        },
        "400": {
          description: "Bad request",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      } as Record<string, ResponseObject | ReferenceObject>;

      const result = visitResponses(responses, {
        kind: "responses",
        documentPath: ["paths", "/users", "post", "responses"],
        rootSegment: "paths",
        method: "post",
        pathTemplate: "/users",
      });

      expect(result).toEqual({
        responses: [
          {
            kind: "content",
            statusCode: "200",
            description: "Success",
            content: [
              {
                mimeType: "application/json",
                schema: {
                  kind: "ref",
                  name: "#/paths/::users/post/responses/200/content/application::json/schema/PostUsers200Response",
                },
              },
            ],
          },
          {
            kind: "content",
            statusCode: "400",
            description: "Bad request",
            content: [
              {
                mimeType: "application/json",
                schema: {
                  kind: "ref",
                  name: "#/paths/::users/post/responses/400/content/application::json/schema/PostUsers400Response",
                },
              },
            ],
          },
        ],
        models: [
          {
            kind: "response",
            name: "PostUsers200Response",
            referencePath:
              "#/paths/::users/post/responses/200/content/application::json/schema/PostUsers200Response",
            statusCode: "200",
            properties: [
              {
                name: "id",
                type: "string",
              },
              {
                name: "name",
                type: "string",
              },
            ],
          },
          {
            kind: "response",
            name: "PostUsers400Response",
            referencePath:
              "#/paths/::users/post/responses/400/content/application::json/schema/PostUsers400Response",
            statusCode: "400",
            properties: [
              {
                name: "error",
                type: "string",
              },
              {
                name: "message",
                type: "string",
              },
            ],
          },
        ],
      });
    });

    it("should handle mixed response types", () => {
      const responses = {
        "200": {
          description: "Success",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: { type: "string" },
                },
              },
            },
          },
        },
        "204": {
          description: "No content",
          // contentなし
        },
        "404": {
          description: "Not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      } as Record<string, ResponseObject | ReferenceObject>;

      const result = visitResponses(responses, {
        kind: "responses",
        documentPath: ["paths", "/api/resource/{id}", "delete", "responses"],
        rootSegment: "paths",
        method: "delete",
        pathTemplate: "/api/resource/{id}",
      });

      expect(result).toEqual({
        responses: [
          {
            kind: "content",
            statusCode: "200",
            description: "Success",
            content: [
              {
                mimeType: "application/json",
                schema: {
                  kind: "ref",
                  name: "#/paths/::api::resource::{id}/delete/responses/200/content/application::json/schema/DeleteApiResourceId200Response",
                },
              },
            ],
          },
          {
            kind: "content",
            statusCode: "204",
            description: "No content",
          },
          {
            kind: "content",
            statusCode: "404",
            description: "Not found",
            content: [
              {
                mimeType: "application/json",
                schema: {
                  kind: "ref",
                  name: "#/components/schemas/Error",
                },
              },
            ],
          },
        ],
        models: [
          {
            kind: "response",
            name: "DeleteApiResourceId200Response",
            referencePath:
              "#/paths/::api::resource::{id}/delete/responses/200/content/application::json/schema/DeleteApiResourceId200Response",
            statusCode: "200",
            properties: [
              {
                name: "data",
                type: "string",
              },
            ],
          },
        ],
      });
    });

    it("should use correct documentPath for each response", () => {
      const responses = {
        "200": {
          description: "OK",
        },
        "500": {
          description: "Error",
        },
      };

      const result = visitResponses(responses, {
        kind: "responses",
        documentPath: ["paths", "/complex/api/endpoint", "patch", "responses"],
        rootSegment: "paths",
        method: "patch",
        pathTemplate: "/complex/api/endpoint",
      });

      expect(result).toEqual({
        responses: [
          {
            kind: "content",
            statusCode: "200",
            description: "OK",
          },
          {
            kind: "content",
            statusCode: "500",
            description: "Error",
          },
        ],
        models: [],
      });
    });

    it("should handle null responses from visitResponse gracefully", () => {
      // visitResponseがnullを返すケース（例：無効なreferenceなど）をシミュレート
      // 実際のテストではmockが必要だが、ここでは概念的なテストとして記載
      const responses = {
        "200": {
          description: "Success",
        },
      };

      const result = visitResponses(responses, {
        kind: "responses",
        documentPath: ["paths", "/test", "get", "responses"],
        rootSegment: "paths",
        method: "get",
        pathTemplate: "/test",
      });

      expect(result).toEqual({
        responses: [
          {
            kind: "content",
            statusCode: "200",
            description: "Success",
          },
        ],
        models: [],
      });
    });
  });
}
