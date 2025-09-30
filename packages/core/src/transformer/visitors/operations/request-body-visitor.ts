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
import type {
  IRModel,
  IRRef,
  IRRequestBody,
  IRRequestContent,
  ReferenceObject,
  RequestBodyObject,
  SchemaObject,
} from "../../../types";
import { isReferenceObject } from "../../../types";
import { generateComponentName } from "../../helpers";
import type { RequestBodyContext } from "../../types";
import { visitRequestBodyObject } from "../schema/object-visitor";
import { visitSchema } from "../schema/schema-visitor";

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

  // ReferenceObjectの場合は$ref情報を保持
  if (isReferenceObject(requestBody)) {
    const ref: IRRef = {
      kind: "ref",
      name: requestBody.$ref,
    };

    const irRequestBody: IRRequestBody = {
      kind: "ref",
      ref,
    };

    return { requestBody: irRequestBody, models: [] };
  }

  // RequestBodyObject として扱う
  const requestBodyObj = requestBody as RequestBodyObject;

  // contentが必須
  if (
    !requestBodyObj.content ||
    Object.keys(requestBodyObj.content).length === 0
  ) {
    consola.warn(
      `RequestBody without content for operation: ${operationId || "unknown"}`,
    );
    return null;
  }

  // contentの処理
  const content: IRRequestContent[] = [];

  for (const [mimeType, mediaType] of Object.entries(requestBodyObj.content)) {
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
          undefined,
          undefined,
          mimeType,
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
            rootSegment: "paths",
          },
          requestBodyObj.required === true,
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
        const componentName = generateComponentName(
          context.pathTemplate,
          context.method,
          "requestBody",
          undefined,
          undefined,
          mimeType,
        );
        const schemaResult = visitSchema(mediaType.schema, {
          documentPath: [
            ...context.documentPath,
            "content",
            mimeType,
            "schema",
            componentName,
          ],
          rootSegment: "paths",
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
    kind: "content",
    content,
    ...(requestBodyObj.required && { required: true }),
    ...(requestBodyObj.description && {
      description: requestBodyObj.description,
    }),
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
        rootSegment: "paths",
        method: "post",
        pathTemplate: "/users",
        contentType: null,
        schemaPath: null,
      });

      expect(result).toEqual({
        requestBody: {
          kind: "content",
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
                type: "string",
              },
              {
                name: "email",
                type: "string",
              },
            ],
            required: true,
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
        rootSegment: "paths",
        method: "post",
        pathTemplate: "/files",
        contentType: null,
        schemaPath: null,
      });

      expect(result).toEqual({
        requestBody: {
          kind: "content",
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
                name: "#/paths/::files/post/requestBody/content/application::xml/schema/PostFilesXmlRequestBody",
              },
            },
            {
              mimeType: "multipart/form-data",
              schema: {
                kind: "ref",
                name: "#/paths/::files/post/requestBody/content/multipart::form-data/schema/PostFilesMultipartFormDataRequestBody",
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
                type: "string",
              },
            ],
          },
          {
            kind: "requestBody",
            name: "PostFilesXmlRequestBody",
            referencePath:
              "#/paths/::files/post/requestBody/content/application::xml/schema/PostFilesXmlRequestBody",
            properties: [
              {
                name: "data",
                type: "string",
              },
            ],
          },
          {
            kind: "requestBody",
            name: "PostFilesMultipartFormDataRequestBody",
            referencePath:
              "#/paths/::files/post/requestBody/content/multipart::form-data/schema/PostFilesMultipartFormDataRequestBody",
            properties: [
              {
                name: "file",
                type: "binary",
              },
            ],
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
        rootSegment: "paths",
        method: "post",
        pathTemplate: "/test",
        contentType: null,
        schemaPath: null,
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
        rootSegment: "paths",
        method: "post",
        pathTemplate: "/test",
        contentType: null,
        schemaPath: null,
      });

      expect(result).toEqual(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "RequestBody without content for operation: testOp",
      );

      warnSpy.mockRestore();
    });

    it("should handle reference requestBody properly", () => {
      const requestBody: ReferenceObject = {
        $ref: "#/components/requestBodies/UserInput",
      };

      const result = visitRequestBody(requestBody, "updateUser", {
        documentPath: ["paths", "/users/{id}", "put", "requestBody"],
        rootSegment: "paths",
        method: "put",
        pathTemplate: "/users/{id}",
        contentType: null,
        schemaPath: null,
      });

      expect(result).toEqual({
        requestBody: {
          kind: "ref",
          ref: {
            kind: "ref",
            name: "#/components/requestBodies/UserInput",
          },
        },
        models: [],
      });
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
        rootSegment: "paths",
        method: "post",
        pathTemplate: "/test",
        contentType: null,
        schemaPath: null,
      });

      expect(result).toEqual({
        requestBody: {
          kind: "content",
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
        rootSegment: "paths",
        method: "post",
        pathTemplate: "/test",
        contentType: null,
        schemaPath: null,
      });

      expect(result).toEqual({
        requestBody: {
          kind: "content",
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
                type: "string",
              },
            ],
          },
        ],
      });
    });
  });
}
