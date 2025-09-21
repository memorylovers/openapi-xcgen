/**
 * response-visitor.ts - ResponseObjectをIRResponseに変換
 *
 * OpenAPIのResponseObject（レスポンス定義）を処理し、
 * IRResponseに変換する。
 *
 * 責務:
 * - ステータスコード、descriptionの処理
 * - contentのMIMEタイプごとのスキーマ処理（visitSchemaに委譲）
 * - レスポンスヘッダーの処理
 * - $ref参照の解決（現時点では未実装）
 */

import { consola } from "consola";
import type {
  IRModel,
  IRResponse,
  IRResponseContent,
  ReferenceObject,
  ResponseObject,
  SchemaObject,
} from "../../../types";
import { isReferenceObject } from "../../../types";
import { generateComponentName } from "../../helpers";
import type { ResponseContext, VisitorContext } from "../../types";
import { visitResponseObject } from "../schema/object-visitor";
import { visitSchema } from "../schema/schema-visitor";

/**
 * Responseの処理結果
 */
export interface ResponseResult {
  /** 生成されたレスポンス */
  response: IRResponse | null;
  /** インラインスキーマから抽出されたモデル（オブジェクト、列挙型、配列、マップを統一） */
  models: IRModel[];
}

/**
 * ResponseObjectをIRResponseに変換し、インラインモデルを抽出
 *
 * @param response - OpenAPIのResponseObjectまたはReferenceObject
 * @param statusCode - HTTPステータスコード
 * @param context - Response用コンテキスト
 * @returns ResponseResult
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
 *             total:
 *               type: integer
 *     headers:
 *       X-Total-Count:
 *         description: Total number of items
 *         schema:
 *           type: integer
 *   '404':
 *     description: Not found
 * ```
 */
export function visitResponse(
  response: ResponseObject | ReferenceObject,
  context: ResponseContext,
): ResponseResult | null {
  const models: IRModel[] = [];

  // $ref参照の場合は現時点でスキップ
  if (isReferenceObject(response)) {
    consola.warn(`Reference response not supported yet: ${response.$ref}`);
    return null;
  }

  // contentの処理
  let content: IRResponseContent[] | null = null;
  if (response.content) {
    content = [];
    for (const [mimeType, mediaType] of Object.entries(response.content)) {
      if (mediaType.schema) {
        // インラインのobjectスキーマを検出
        if (
          !isReferenceObject(mediaType.schema) &&
          mediaType.schema.type === "object"
        ) {
          // コンポーネント名を生成
          const componentName = generateComponentName(
            context.pathTemplate,
            context.method,
            "response",
            context.statusCode,
          );

          // レスポンスvisitorで処理して、IRResponseModelとして抽出
          const responseResult = visitResponseObject(
            mediaType.schema as SchemaObject,
            {
              documentPath: [
                ...context.documentPath,
                "content",
                mimeType,
                "schema",
                componentName,
              ],
              rootSegment: "paths",
            },
            context.statusCode,
          );

          if (responseResult && responseResult.models.length > 0) {
            // 全てのモデル（メインのレスポンスモデル含む）をmodelsに追加
            models.push(...responseResult.models);

            // エンドポイントのcontentでは、抽出されたResponseModelへの参照を使用
            const firstModel = responseResult.models[0];
            if (firstModel.kind === "response") {
              const refType = {
                kind: "ref" as const,
                name: firstModel.referencePath,
              };
              content.push({ mimeType, schema: refType });
            } else {
              consola.warn(
                `Expected response model from visitResponseObject, got: ${firstModel.kind}`,
              );
              continue;
            }
          }
        } else {
          // それ以外のスキーマは通常通り処理
          const schemaContext: VisitorContext = {
            documentPath: [
              ...context.documentPath,
              "content",
              mimeType,
              "schema",
            ],
            rootSegment: "paths",
          };
          const schemaResult = visitSchema(mediaType.schema, schemaContext);
          if (schemaResult.type) {
            content.push({ mimeType, schema: schemaResult.type });
            // ネストしたモデルを収集
            if (schemaResult.models) {
              models.push(...schemaResult.models);
            }
          }
        }
      }
    }
    // 空のcontentは返さない
    if (content.length === 0) {
      content = null;
    }
  }

  // headers は未対応

  const irResponse: IRResponse = {
    statusCode: context.statusCode,
    ...(response.description && { description: response.description }),
    ...(content && { content }),
    // headers は未対応
  };

  return { response: irResponse, models };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitResponse", () => {
    it("should handle basic response without content", () => {
      const response: ResponseObject = {
        description: "Success",
      };

      const result = visitResponse(response, {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
        method: "get",
        pathTemplate: "/users",
        statusCode: "200",
        contentType: null,
        schemaPath: null,
      });

      expect(result).toEqual({
        response: {
          statusCode: "200",
          description: "Success",
        },
        models: [],
      });
    });

    it("should handle response with JSON content", () => {
      const response: ResponseObject = {
        description: "User list",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                users: {
                  type: "array",
                  items: { type: "string" },
                },
              },
            },
          },
        },
      };

      const result = visitResponse(response, {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
        method: "get",
        pathTemplate: "/users",
        statusCode: "200",
        contentType: null,
        schemaPath: null,
      });

      expect(result).toEqual({
        response: {
          statusCode: "200",
          description: "User list",
          content: [
            {
              mimeType: "application/json",
              schema: {
                kind: "ref",
                name: "#/paths/::users/get/responses/200/content/application::json/schema/GetUsers200Response",
              },
            },
          ],
        },
        models: [
          {
            kind: "response",
            name: "GetUsers200Response",
            referencePath:
              "#/paths/::users/get/responses/200/content/application::json/schema/GetUsers200Response",
            statusCode: "200",
            properties: [
              {
                name: "users",
                type: {
                  kind: "array",
                  itemType: "string",
                },
              },
            ],
          },
        ],
      });
    });

    it("should handle response with multiple content types", () => {
      const response: ResponseObject = {
        description: "Multi-format response",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: { type: "string" },
              },
            },
          },
          "application/xml": {
            schema: {
              type: "object",
              properties: {
                data: { type: "string" },
              },
            },
          },
          "text/plain": {
            schema: { type: "string" },
          },
        },
      };

      const result = visitResponse(response, {
        documentPath: ["paths", "/data", "get", "responses", "200"],
        rootSegment: "paths",
        method: "get",
        pathTemplate: "/data",
        statusCode: "200",
        contentType: null,
        schemaPath: null,
      });

      expect(result).toEqual({
        response: {
          statusCode: "200",
          description: "Multi-format response",
          content: [
            {
              mimeType: "application/json",
              schema: {
                kind: "ref",
                name: "#/paths/::data/get/responses/200/content/application::json/schema/GetData200Response",
              },
            },
            {
              mimeType: "application/xml",
              schema: {
                kind: "ref",
                name: "#/paths/::data/get/responses/200/content/application::xml/schema/GetData200Response",
              },
            },
            {
              mimeType: "text/plain",
              schema: "string",
            },
          ],
        },
        models: [
          {
            kind: "response",
            name: "GetData200Response",
            referencePath:
              "#/paths/::data/get/responses/200/content/application::json/schema/GetData200Response",
            statusCode: "200",
            properties: [
              {
                name: "data",
                type: "string",
              },
            ],
          },
          {
            kind: "response",
            name: "GetData200Response",
            referencePath:
              "#/paths/::data/get/responses/200/content/application::xml/schema/GetData200Response",
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

    it("should handle response with headers", () => {
      const response: ResponseObject = {
        description: "Success with headers",
        headers: {
          "X-Total-Count": {
            description: "Total number of items",
            schema: { type: "integer" },
          },
          "X-Rate-Limit": {
            schema: { type: "integer" },
          },
        },
      };

      const result = visitResponse(response, {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
        method: "get",
        pathTemplate: "/users",
        statusCode: "200",
        contentType: null,
        schemaPath: null,
      });

      expect(result).toEqual({
        response: {
          statusCode: "200",
          description: "Success with headers",
        },
        models: [],
      });
      // headers は未対応
    });

    it("should warn and return null for reference response", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const response: ReferenceObject = {
        $ref: "#/components/responses/NotFound",
      };

      const result = visitResponse(response, {
        documentPath: ["paths", "/users/{id}", "get", "responses", "404"],
        rootSegment: "paths",
        method: "get",
        pathTemplate: "/users/{id}",
        statusCode: "404",
        contentType: null,
        schemaPath: null,
      });

      expect(result).toEqual(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "Reference response not supported yet: #/components/responses/NotFound",
      );

      warnSpy.mockRestore();
    });

    it("should handle 4xx and 5xx error responses", () => {
      const response: ResponseObject = {
        description: "Bad Request",
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
      };

      const result = visitResponse(response, {
        documentPath: ["paths", "/users", "post", "responses", "400"],
        rootSegment: "paths",
        method: "post",
        pathTemplate: "/users",
        statusCode: "400",
        contentType: null,
        schemaPath: null,
      });

      expect(result).toEqual({
        response: {
          statusCode: "400",
          description: "Bad Request",
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
        models: [
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
  });
}
