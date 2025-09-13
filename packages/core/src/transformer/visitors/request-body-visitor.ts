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
    description: requestBody.description || null,
    required: requestBody.required || false,
    content,
  };

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

      expect(result).toEqual({
        requestBody: {
          description: "User data",
          required: true,
          content: [
            {
              mimeType: "application/json",
              schema: {
                kind: "ref",
                name: "#/paths/::users/post/requestBody/content/application::json/schema/PostUsersRequestBody",
              },
            },
          ],
        },
        models: [
          {
            kind: "requestBody",
            name: "PostUsersRequestBody",
            referencePath:
              "#/paths/::users/post/requestBody/content/application::json/schema/PostUsersRequestBody",
            properties: [
              {
                name: "name",
                description: null,
                type: "string",
                required: false,
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
              {
                name: "email",
                description: null,
                type: "string",
                required: false,
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
            ],
            required: true,
            description: null,
          },
        ],
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

      expect(result).toEqual({
        requestBody: {
          description: null,
          required: false,
          content: [
            {
              mimeType: "application/json",
              schema: {
                kind: "ref",
                name: "#/paths/::files/post/requestBody/content/application::json/schema/PostFilesRequestBody",
              },
            },
            {
              mimeType: "application/xml",
              schema: {
                kind: "ref",
                name: "#/paths/::files/post/requestBody/content/application::xml/schema/PostFilesRequestBody",
              },
            },
            {
              mimeType: "multipart/form-data",
              schema: {
                kind: "ref",
                name: "#/paths/::files/post/requestBody/content/multipart::form-data/schema/PostFilesRequestBody",
              },
            },
          ],
        },
        models: [
          {
            kind: "requestBody",
            name: "PostFilesRequestBody",
            referencePath:
              "#/paths/::files/post/requestBody/content/application::json/schema/PostFilesRequestBody",
            properties: [
              {
                name: "data",
                description: null,
                type: "string",
                required: false,
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
            ],
            required: false,
            description: null,
          },
          {
            kind: "requestBody",
            name: "PostFilesRequestBody",
            referencePath:
              "#/paths/::files/post/requestBody/content/application::xml/schema/PostFilesRequestBody",
            properties: [
              {
                name: "data",
                description: null,
                type: "string",
                required: false,
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
            ],
            required: false,
            description: null,
          },
          {
            kind: "requestBody",
            name: "PostFilesRequestBody",
            referencePath:
              "#/paths/::files/post/requestBody/content/multipart::form-data/schema/PostFilesRequestBody",
            properties: [
              {
                name: "file",
                description: null,
                type: "binary",
                required: false,
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
            ],
            required: false,
            description: null,
          },
        ],
      });
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

      expect(result).toEqual(null);
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

      expect(result).toEqual(null);
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

      expect(result).toEqual(null);
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

      expect(result).toEqual({
        requestBody: {
          description: null,
          required: false,
          content: [
            {
              mimeType: "text/plain",
              schema: "string",
            },
          ],
        },
        models: [],
      });

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

      expect(result).toEqual({
        requestBody: {
          description: null,
          required: false,
          content: [
            {
              mimeType: "application/json",
              schema: {
                kind: "ref",
                name: "#/paths/::test/post/requestBody/content/application::json/schema/PostTestRequestBody",
              },
            },
          ],
        },
        models: [
          {
            kind: "requestBody",
            name: "PostTestRequestBody",
            referencePath:
              "#/paths/::test/post/requestBody/content/application::json/schema/PostTestRequestBody",
            properties: [
              {
                name: "data",
                description: null,
                type: "string",
                required: false,
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
            ],
            required: false,
            description: null,
          },
        ],
      });
    });
  });
}
