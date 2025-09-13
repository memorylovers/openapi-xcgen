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
import { isReferenceObject } from "../../types/guards";
import type {
  ReferenceObject,
  ResponseObject,
  SchemaObject,
} from "../../types/index";
import type {
  IRModel,
  IRResponse,
  IRResponseContent,
} from "../../types/ir/index";
import { generateComponentName } from "../helpers/generate-component-name";
import type { VisitorContext } from "../types";
import { visitResponseObject } from "./object-visitor";
import { visitSchema } from "./schema-visitor";

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
 * Responseの処理用コンテキスト
 */
export interface ResponseContext extends VisitorContext {
  /** HTTPメソッド */
  method: string;
  /** パステンプレート */
  pathTemplate: string;
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
  statusCode: string,
  context: ResponseContext,
): ResponseResult | null {
  const models: IRModel[] = [];

  // $ref参照の場合は現時点でスキップ
  if (isReferenceObject(response)) {
    consola.warn(`Reference response not supported yet: ${response.$ref}`);
    return null;
  }

  // contentの処理
  let content: IRResponseContent[] | undefined;
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
            statusCode,
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
            },
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
          const schemaContext: VisitorContext = {
            documentPath: [
              ...context.documentPath,
              "content",
              mimeType,
              "schema",
            ],
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
      content = undefined;
    }
  }

  // TODO: headersの処理（Step 12で実装予定）

  const irResponse: IRResponse = {
    statusCode,
    description: response.description,
  };

  // Optional properties: only include if they have actual values
  if (content !== undefined) {
    irResponse.content = content;
  }

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

      const result = visitResponse(response, "200", {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        method: "get",
        pathTemplate: "/users",
      });

      expect(result).not.toBeNull();
      expect(result!.response).toEqual({
        statusCode: "200",
        description: "Success",
        content: undefined,
      });
      expect(result!.models).toEqual([]);
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

      const result = visitResponse(response, "200", {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        method: "get",
        pathTemplate: "/users",
      });

      expect(result).not.toBeNull();
      expect(result!.response).not.toBeNull();
      expect(result!.response?.statusCode).toBe("200");
      expect(result!.response?.content).toBeDefined();
      expect(
        result!.response?.content?.find(
          (c) => c.mimeType === "application/json",
        ),
      ).toBeDefined();
      // インラインobjectスキーマは独立したResponseModelとして抽出される
      expect(result!.models).toHaveLength(1);
      expect(result!.models[0]).toEqual({
        kind: "response",
        name: "GetUsers200Response",
        referencePath: expect.stringContaining("GetUsers200Response"),
        properties: expect.any(Array),
        statusCode: "200",
      });
      // response.contentでは抽出されたObjectModelを参照
      const jsonContent = result!.response?.content?.find(
        (c) => c.mimeType === "application/json",
      );
      expect(jsonContent?.schema).toEqual({
        kind: "ref",
        name: expect.stringContaining("GetUsers200Response"),
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

      const result = visitResponse(response, "200", {
        documentPath: ["paths", "/data", "get", "responses", "200"],
        method: "get",
        pathTemplate: "/data",
      });

      expect(result).not.toBeNull();
      expect(result!.response?.content).toBeDefined();
      expect(result!.response?.content).toHaveLength(3);
      // インラインobjectスキーマは独立したObjectModelとして抽出される（JSON、XML用）
      expect(result!.models.length).toBeGreaterThan(0);
      // プリミティブスキーマ（text/plain）は直接型として保持
      const plainContent = result!.response?.content?.find(
        (c) => c.mimeType === "text/plain",
      );
      expect(plainContent?.schema).toBe("string"); // プリミティブ文字列

      // オブジェクトスキーマは参照として保持
      const jsonContent = result!.response?.content?.find(
        (c) => c.mimeType === "application/json",
      );
      expect(jsonContent?.schema).toEqual({
        kind: "ref",
        name: expect.any(String),
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

      const result = visitResponse(response, "200", {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        method: "get",
        pathTemplate: "/users",
      });

      expect(result).not.toBeNull();
      expect(result!.response).not.toBeNull();
      // TODO: headersの処理はStep 12で実装
      // expect(result?.headers).toBeDefined();
    });

    it("should warn and return null for reference response", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const response: ReferenceObject = {
        $ref: "#/components/responses/NotFound",
      };

      const result = visitResponse(response, "404", {
        documentPath: ["paths", "/users/{id}", "get", "responses", "404"],
        method: "get",
        pathTemplate: "/users/{id}",
      });

      expect(result).toBeNull();
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

      const result = visitResponse(response, "400", {
        documentPath: ["paths", "/users", "post", "responses", "400"],
        method: "post",
        pathTemplate: "/users",
      });

      expect(result).not.toBeNull();
      expect(result!.response?.statusCode).toBe("400");
      expect(result!.response?.description).toBe("Bad Request");
      expect(
        result!.response?.content?.find(
          (c) => c.mimeType === "application/json",
        ),
      ).toBeDefined();
      // エラーレスポンスのインラインスキーマも独立したObjectModelとして抽出される
      expect(result!.models).toHaveLength(1);
      expect(result!.models[0]).toEqual({
        kind: "response",
        name: "PostUsers400Response",
        referencePath: expect.stringContaining("PostUsers400Response"),
        properties: expect.any(Array),
        statusCode: "400",
      });
      // response.contentでは抽出されたObjectModelを参照
      const jsonContent = result!.response?.content?.find(
        (c) => c.mimeType === "application/json",
      );
      expect(jsonContent?.schema).toEqual({
        kind: "ref",
        name: expect.stringContaining("PostUsers400Response"),
      });
    });
  });
}
