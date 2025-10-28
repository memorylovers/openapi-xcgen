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
  IRHttpMethod,
  IRModel,
  IRRef,
  IRResponse,
  IRResponseContent,
  IRResponseHeader,
  ReferenceObject,
  ResponseObject,
  SchemaObject,
} from "../../../types";
import { isReferenceObject } from "../../../types";
import { isPathsResponseContext } from "../../../types/guards";
import { getModelName, parseResponsePath } from "../../helpers";
import type { ResponseContext } from "../../types";
import { visitResponseObject } from "../schema/object-visitor";
import { visitSchema } from "../schema/schema-visitor";
import { visitHeader } from "./header-visitor";

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

  // statusCodeを取得（共通処理）
  let statusCode = "200";
  if (isPathsResponseContext(context)) {
    const parsed = parseResponsePath(context.documentPath);
    statusCode = parsed?.statusCode ?? "200";
  }

  // ReferenceObjectの場合は$ref情報を保持
  if (isReferenceObject(response)) {
    const ref: IRRef = {
      kind: "ref",
      name: response.$ref,
    };

    const irResponse: IRResponse = {
      kind: "ref",
      ref,
      statusCode,
    };

    return { response: irResponse, models: [] };
  }

  // ResponseObject として扱う
  const responseObj = response as ResponseObject;

  // contentの処理
  let content: IRResponseContent[] | null = null;
  if (responseObj.content) {
    content = [];
    for (const [mimeType, mediaType] of Object.entries(responseObj.content)) {
      if (mediaType.schema) {
        // getModelNameで名前を生成（すべてのスキーマに対して）
        const componentName = getModelName({
          ...context,
          contentType: mimeType,
        } as ResponseContext);

        // ResponseContextを作成（documentPathにコンポーネント名を追加）
        const schemaContext: ResponseContext = isPathsResponseContext(context)
          ? {
              kind: "response",
              documentPath: [
                ...context.documentPath,
                "content",
                mimeType,
                "schema",
                componentName,
              ],
              rootSegment: context.rootSegment,
              contentType: mimeType,
              schemaPath: ["content", mimeType, "schema"],
            }
          : {
              kind: "componentsResponse",
              documentPath: [
                ...context.documentPath,
                "content",
                mimeType,
                "schema",
                componentName,
              ],
              rootSegment: context.rootSegment,
              contentType: mimeType,
              schemaPath: ["content", mimeType, "schema"],
            };

        // インラインのobjectスキーマを検出
        if (
          !isReferenceObject(mediaType.schema) &&
          mediaType.schema.type === "object"
        ) {
          // レスポンスvisitorで処理して、IRResponseModelとして抽出
          let statusCode = "200";
          if (isPathsResponseContext(context)) {
            const parsed = parseResponsePath(context.documentPath);
            statusCode = parsed?.statusCode ?? "200";
          }
          const responseResult = visitResponseObject(
            mediaType.schema as SchemaObject,
            schemaContext,
            statusCode,
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

  // headersの処理
  let headers: IRResponseHeader[] | undefined;
  if (responseObj.headers) {
    headers = [];
    for (const [headerName, headerDef] of Object.entries(responseObj.headers)) {
      // ReferenceObjectの場合は警告
      if (isReferenceObject(headerDef)) {
        consola.warn(`Reference header not supported yet: ${headerDef.$ref}`);
        continue;
      }

      // visitHeaderで処理
      let pathTemplate: string | null = null;
      let statusCode = "200";
      let method: IRHttpMethod | null = null;
      if (isPathsResponseContext(context)) {
        const parsed = parseResponsePath(context.documentPath);
        if (parsed) {
          pathTemplate = parsed.pathTemplate;
          statusCode = parsed.statusCode;
          method = parsed.method;
        }
      }
      const headerResult = visitHeader(headerDef, {
        kind: "header",
        documentPath: [...context.documentPath, "headers", headerName],
        rootSegment: context.rootSegment,
        headerName,
        pathTemplate,
        statusCode,
        method,
      });

      if (headerResult) {
        headers.push(headerResult.header);
        models.push(...headerResult.models);
      }
    }
    // 空配列は undefined にする
    if (headers.length === 0) {
      headers = undefined;
    }
  }

  const irResponse: IRResponse = {
    kind: "content",
    statusCode,
    ...(responseObj.description && { description: responseObj.description }),
    ...(content && { content }),
    ...(headers && { headers }),
  };

  return { response: irResponse, models };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("visitResponse", () => {
    it("should handle basic response without content", () => {
      const response: ResponseObject = {
        description: "Success",
      };

      const result = visitResponse(response, {
        kind: "response",
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      });

      expect(result).toEqual({
        response: {
          kind: "content",
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
        kind: "response",
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      });

      expect(result).toEqual({
        response: {
          kind: "content",
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
                  kind: "ref",
                  name: "#/paths/::users/get/responses/200/content/application::json/schema/GetUsers200ResponseUsers",
                },
              },
            ],
          },
          {
            kind: "array",
            name: "GetUsers200ResponseUsers",
            referencePath:
              "#/paths/::users/get/responses/200/content/application::json/schema/GetUsers200ResponseUsers",
            itemType: "string",
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
        kind: "response",
        documentPath: ["paths", "/data", "get", "responses", "200"],
        rootSegment: "paths",
      });

      expect(result).toEqual({
        response: {
          kind: "content",
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
                name: "#/paths/::data/get/responses/200/content/application::xml/schema/GetData200XmlResponse",
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
            name: "GetData200XmlResponse",
            referencePath:
              "#/paths/::data/get/responses/200/content/application::xml/schema/GetData200XmlResponse",
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

    it("should handle reference response by preserving $ref information", () => {
      const response: ReferenceObject = {
        $ref: "#/components/responses/NotFound",
      };

      const result = visitResponse(response, {
        kind: "response",
        documentPath: ["paths", "/users/{id}", "get", "responses", "404"],
        rootSegment: "paths",
      });

      // $ref情報がIRRefとして保持される
      expect(result).toEqual({
        response: {
          kind: "ref",
          statusCode: "404",
          ref: {
            kind: "ref",
            name: "#/components/responses/NotFound",
          },
        },
        models: [],
      });
    });

    it("should handle different component reference patterns", () => {
      // BadRequestの参照
      const badRequest: ReferenceObject = {
        $ref: "#/components/responses/BadRequest",
      };

      const result400 = visitResponse(badRequest, {
        kind: "response",
        documentPath: ["paths", "/api/users", "post", "responses", "400"],
        rootSegment: "paths",
      });

      expect(result400).toEqual({
        response: {
          kind: "ref",
          statusCode: "400",
          ref: {
            kind: "ref",
            name: "#/components/responses/BadRequest",
          },
        },
        models: [],
      });

      // InternalServerErrorの参照
      const serverError: ReferenceObject = {
        $ref: "#/components/responses/InternalServerError",
      };

      const result500 = visitResponse(serverError, {
        kind: "response",
        documentPath: ["paths", "/api/users", "post", "responses", "500"],
        rootSegment: "paths",
      });

      expect(result500).toEqual({
        response: {
          kind: "ref",
          statusCode: "500",
          ref: {
            kind: "ref",
            name: "#/components/responses/InternalServerError",
          },
        },
        models: [],
      });
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
        kind: "response",
        documentPath: ["paths", "/users", "post", "responses", "400"],
        rootSegment: "paths",
      });

      expect(result).toEqual({
        response: {
          kind: "content",
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
