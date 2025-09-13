/**
 * request-body-visitor.ts - RequestBodyObjectをIRRequestBodyに変換
 *
 * OpenAPIのRequestBodyObject（リクエストボディ定義）を処理し、
 * IRRequestBodyに変換する。
 *
 * 責務:
 * - required、descriptionの処理
 * - contentのMIMEタイプごとのスキーマ処理（visitSchemaに委譲）
 * - $ref参照の解決（現時点では未実装）
 */

import { consola } from "consola";
import { isReferenceObject } from "../../types/guards";
import type {
  ReferenceObject,
  RequestBodyObject,
  SchemaObject,
} from "../../types/index";
import type {
  IRModel,
  IRRequestBody,
  IRRequestContent,
} from "../../types/ir/index";
import { generateComponentName } from "../helpers/generate-component-name";
import type { VisitorContext } from "../types";
import { visitRequestBodyObject } from "./object-visitor";
import { visitSchema } from "./schema-visitor";

/**
 * RequestBodyの処理結果
 */
export interface RequestBodyResult {
  /** 生成されたリクエストボディ */
  requestBody: IRRequestBody | null;
  /** インラインスキーマから抽出されたモデル（オブジェクト、列挙型、配列、マップを統一） */
  models: IRModel[];
}

/**
 * RequestBodyの処理用コンテキスト
 */
export interface RequestBodyContext extends VisitorContext {
  /** HTTPメソッド */
  method: string;
  /** パステンプレート */
  pathTemplate: string;
}

/**
 * RequestBodyObjectをIRRequestBodyに変換し、インラインモデルを抽出
 *
 * @param requestBody - OpenAPIのRequestBodyObjectまたはReferenceObject
 * @param operationId - エンドポイントのoperationId（命名に使用）
 * @param context - RequestBody用コンテキスト
 * @returns RequestBodyResult
 *
 * @example OpenAPI YAML
 * ```yaml
 * requestBody:
 *   description: User data
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           name:
 *             type: string
 *           email:
 *             type: string
 *             format: email
 *         required: [name, email]
 *     application/xml:
 *       schema:
 *         type: object
 *         xml:
 *           name: user
 * ```
 */
export function visitRequestBody(
  requestBody: RequestBodyObject | ReferenceObject,
  operationId: string | null,
  context: RequestBodyContext,
): RequestBodyResult | null {
  const models: IRModel[] = [];

  // $ref参照の場合は現時点でスキップ
  if (isReferenceObject(requestBody)) {
    consola.warn(
      `Reference requestBody not supported yet: ${requestBody.$ref}`,
    );
    return null;
  }

  // contentが必須
  if (!requestBody.content || Object.keys(requestBody.content).length === 0) {
    consola.warn(
      `RequestBody without content for operation: ${operationId || "unknown"}`,
    );
    return null;
  }

  // contentの処理
  const content: IRRequestContent[] = [];
  for (const [mimeType, mediaType] of Object.entries(requestBody.content)) {
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
          "requestBody",
        );

        // リクエストボディvisitorで処理して、IRRequestBodyModelとして抽出
        const requestBodyResult = visitRequestBodyObject(
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
          requestBody.required || false,
        );

        if (requestBodyResult && requestBodyResult.models.length > 0) {
          // 全てのモデル（メインのリクエストボディモデル含む）をmodelsに追加
          models.push(...requestBodyResult.models);

          // エンドポイントのcontentでは、抽出されたRequestBodyModelへの参照を使用
          const firstModel = requestBodyResult.models[0];
          if (firstModel.kind === "requestBody") {
            const refType = {
              kind: "ref" as const,
              name: firstModel.referencePath,
            };
            content.push({ mimeType, schema: refType });
          } else {
            consola.warn(
              `Expected request body model from visitRequestBodyObject, got: ${firstModel.kind}`,
            );
            continue;
          }
        }
      } else {
        // それ以外のスキーマは通常通り処理
        const schemaResult = visitSchema(mediaType.schema, {
          documentPath: [
            ...context.documentPath,
            "content",
            mimeType,
            "schema",
          ],
        });
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
    consola.warn(
      `No valid schemas in requestBody content for operation: ${operationId || "unknown"}`,
    );
    return null;
  }

  const irRequestBody: IRRequestBody = {
    required: requestBody.required || false,
    content,
  };

  // Optional properties: only include if they have actual values
  if (requestBody.description !== undefined) {
    irRequestBody.description = requestBody.description;
  }

  return {
    requestBody: irRequestBody,
    models,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitRequestBody", () => {
    it("should handle basic requestBody with JSON content", () => {
      const requestBody: RequestBodyObject = {
        description: "User data",
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
              },
            },
          },
        },
      };

      const result = visitRequestBody(requestBody, "createUser", {
        documentPath: ["paths", "/users", "post", "requestBody"],
        method: "post",
        pathTemplate: "/users",
      });

      expect(result).not.toBeNull();
      expect(result!.requestBody).not.toBeNull();
      expect(result!.requestBody?.description).toBe("User data");
      expect(result!.requestBody?.required).toBe(true);
      expect(result!.requestBody?.content).toBeDefined();
      expect(
        result!.requestBody?.content?.find(
          (c) => c.mimeType === "application/json",
        ),
      ).toBeDefined();
      // インラインobjectスキーマは独立したRequestBodyModelとして抽出される
      expect(result!.models).toHaveLength(1);
      expect(result!.models[0]).toEqual({
        kind: "requestBody",
        name: "PostUsersRequestBody",
        referencePath: expect.stringContaining("PostUsersRequestBody"),
        properties: expect.any(Array),
        required: true,
      });
      // requestBody.contentでは抽出されたObjectModelを参照
      const jsonContent = result!.requestBody?.content?.find(
        (c) => c.mimeType === "application/json",
      );
      expect(jsonContent?.schema).toEqual({
        kind: "ref",
        name: expect.stringContaining("PostUsersRequestBody"),
      });
    });

    it("should handle requestBody with multiple content types", () => {
      const requestBody: RequestBodyObject = {
        required: false,
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
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                file: { type: "string", format: "binary" },
              },
            },
          },
        },
      };

      const result = visitRequestBody(requestBody, "uploadFile", {
        documentPath: ["paths", "/files", "post", "requestBody"],
        method: "post",
        pathTemplate: "/files",
      });

      expect(result).not.toBeNull();
      expect(result!.requestBody?.required).toBe(false);
      expect(result!.requestBody?.content).toBeDefined();
      expect(result!.requestBody?.content).toHaveLength(3);
      expect(
        result!.requestBody?.content?.find(
          (c) => c.mimeType === "multipart/form-data",
        ),
      ).toBeDefined();
      // インラインobjectスキーマは独立したRequestBodyModelとして抽出される
      expect(result!.models.length).toBeGreaterThan(0);
      // 複数のMIMEタイプで同じ構造のオブジェクトが含まれる場合、RequestBodyModelが生成される
      const requestBodyModel = result!.models.find(
        (m) => m.kind === "requestBody",
      );
      expect(requestBodyModel).toBeDefined();
      expect(requestBodyModel?.name).toBe("PostFilesRequestBody");
    });

    it("should warn and return null for requestBody without content", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const requestBody: RequestBodyObject = {
        description: "Empty body",
        required: true,
        // No content
      } as RequestBodyObject;

      const result = visitRequestBody(requestBody, "testOp", {
        documentPath: ["paths", "/test", "post", "requestBody"],
        method: "post",
        pathTemplate: "/test",
      });

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        "RequestBody without content for operation: testOp",
      );

      warnSpy.mockRestore();
    });

    it("should warn and return null for empty content object", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const requestBody: RequestBodyObject = {
        content: {},
      };

      const result = visitRequestBody(requestBody, "testOp", {
        documentPath: ["paths", "/test", "post", "requestBody"],
        method: "post",
        pathTemplate: "/test",
      });

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        "RequestBody without content for operation: testOp",
      );

      warnSpy.mockRestore();
    });

    it("should warn and return null for reference requestBody", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const requestBody: ReferenceObject = {
        $ref: "#/components/requestBodies/UserInput",
      };

      const result = visitRequestBody(requestBody, "updateUser", {
        documentPath: ["paths", "/users/{id}", "put", "requestBody"],
        method: "put",
        pathTemplate: "/users/{id}",
      });

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        "Reference requestBody not supported yet: #/components/requestBodies/UserInput",
      );

      warnSpy.mockRestore();
    });

    it("should handle content with media types that have no schema", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const requestBody: RequestBodyObject = {
        content: {
          "application/json": {
            // No schema
          },
          "text/plain": {
            schema: { type: "string" },
          },
        } as RequestBodyObject["content"],
      };

      const result = visitRequestBody(requestBody, "testOp", {
        documentPath: ["paths", "/test", "post", "requestBody"],
        method: "post",
        pathTemplate: "/test",
      });

      expect(result).not.toBeNull();
      expect(result!.requestBody).not.toBeNull();
      expect(
        result!.requestBody?.content?.find((c) => c.mimeType === "text/plain"),
      ).toBeDefined();
      expect(
        result!.requestBody?.content?.find(
          (c) => c.mimeType === "application/json",
        ),
      ).toBeUndefined();

      warnSpy.mockRestore();
    });

    it("should default required to false when not specified", () => {
      const requestBody: RequestBodyObject = {
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
      };

      const result = visitRequestBody(requestBody, "testOp", {
        documentPath: ["paths", "/test", "post", "requestBody"],
        method: "post",
        pathTemplate: "/test",
      });

      expect(result).not.toBeNull();
      expect(result!.requestBody?.required).toBe(false);
    });
  });
}
