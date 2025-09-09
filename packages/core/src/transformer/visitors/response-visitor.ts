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
  IRContentMap,
  IRModel,
  IRRef,
  IRResponse,
} from "../../types/ir/index";
import { buildReferencePath } from "../helpers/build-reference-path";
import { generateComponentName } from "../helpers/generate-component-name";
import type { VisitorContext } from "../types";
import { visitObject } from "./object-visitor";
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
  let content: IRContentMap | undefined;
  if (response.content) {
    content = {};
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

          // オブジェクトvisitorで処理してIRModelを生成
          const objectResult = visitObject(mediaType.schema as SchemaObject, {
            documentPath: [
              ...context.documentPath,
              "content",
              mimeType,
              "schema",
            ],
          });

          if (objectResult && objectResult.models.length > 0) {
            // ObjectVisitorResultから最初のモデルを取得し、名前とreferencePathを更新
            const firstModel = objectResult.models[0];
            if (firstModel.kind !== "object") {
              consola.warn(
                `Expected object model from visitObject, got: ${firstModel.kind}`,
              );
              continue;
            }

            const model: IRModel = {
              kind: "object",
              name: componentName,
              properties: firstModel.properties,
              referencePath: buildReferencePath([
                ...context.documentPath,
                "content",
                mimeType,
                "schema",
              ]),
            };

            // Optional properties: only include if they have actual values
            if (mediaType.schema.description !== undefined) {
              model.description = mediaType.schema.description;
            }
            models.push(model);

            // ネストしたモデルも追加
            if (objectResult.models.length > 1) {
              models.push(...objectResult.models.slice(1));
            }

            // contentには$refを設定
            const ref: IRRef = {
              kind: "ref",
              name: `#/components/schemas/${componentName}`,
            };
            content[mimeType] = ref;
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
            content[mimeType] = schemaResult.type;
            // ネストしたモデルを収集
            if (schemaResult.models) {
              models.push(...schemaResult.models);
            }
          }
        }
      }
    }
    // 空のcontentは返さない
    if (Object.keys(content).length === 0) {
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
      expect(result!.response?.content?.["application/json"]).toBeDefined();
      // インラインobjectスキーマはモデルとして抽出される
      expect(result!.models).toHaveLength(1);
      expect(result!.models[0].name).toBe("GetUsers200Response");
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
      expect(Object.keys(result!.response?.content || {})).toHaveLength(3);
      // 複数のインラインobjectスキーマがモデルとして抽出される
      expect(result!.models).toHaveLength(2); // JSONとXMLの2つ
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
      expect(result!.response?.content?.["application/json"]).toBeDefined();
      // エラーレスポンスのインラインスキーマもモデルとして抽出
      expect(result!.models).toHaveLength(1);
      expect(result!.models[0].name).toBe("PostUsers400Response");
    });
  });
}
