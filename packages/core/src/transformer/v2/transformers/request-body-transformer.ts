/**
 * Request Body Transformer - v2 Transformer Architecture
 *
 * RequestBodyObjectをIRRequestBodyに変換します。
 * contentの処理はcontent-traverserに委譲します。
 */

import { consola } from "consola";
import type {
  IRModel,
  IRRef,
  IRRequestBody,
  IRRequestBodyModel,
  IRRequestContent,
  ReferenceObject,
  RequestBodyObject,
} from "../../../types";
import { isReferenceObject } from "../../../types";
import { buildReferencePath } from "../../helpers";
import type { VisitorContext } from "../../types";
import type { ContentTraversalResult, TransformResult } from "../types";

/**
 * RequestBodyObjectをIRRequestBodyに変換
 *
 * @param requestBody - RequestBodyObjectまたはReferenceObject
 * @param context - Visitorコンテキスト
 * @param contentResult - content-traverserからの結果
 * @returns 変換結果
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
 * ```
 */
export function transformRequestBody(
  requestBody: RequestBodyObject | ReferenceObject,
  context: VisitorContext,
  contentResult: ContentTraversalResult,
): TransformResult {
  // ReferenceObjectの場合
  if (isReferenceObject(requestBody)) {
    const ref: IRRef = {
      kind: "ref",
      name: requestBody.$ref,
    };

    const irRequestBody: IRRequestBody = {
      kind: "ref",
      ref,
    };

    return {
      type: irRequestBody as unknown as TransformResult["type"],
      models: [],
    };
  }

  // RequestBodyObjectとして処理
  const requestBodyObj = requestBody as RequestBodyObject;

  // contentが空の場合
  if (contentResult.content.length === 0) {
    consola.warn(
      `RequestBody without valid content at: ${buildReferencePath(context.documentPath)}`,
    );
    return {
      type: null,
      models: [],
    };
  }

  // IRRequestContentに変換
  const irContent: IRRequestContent[] = contentResult.content.map((c) => ({
    mimeType: c.mimeType,
    schema: c.schema,
  }));

  // IRRequestBodyを構築
  const irRequestBody: IRRequestBody = {
    kind: "content",
    content: irContent,
    ...(requestBodyObj.required && { required: true }),
    ...(requestBodyObj.description && {
      description: requestBodyObj.description,
    }),
  };

  return {
    type: irRequestBody as unknown as TransformResult["type"],
    models: contentResult.childModels,
  };
}

/**
 * インラインobjectスキーマからIRRequestBodyModelを生成
 *
 * これは特別なケースで、RequestBodyのcontentに直接objectスキーマがある場合に
 * IRRequestBodyModelとして抽出します。
 *
 * @param properties - オブジェクトのプロパティ配列
 * @param context - Visitorコンテキスト
 * @param required - リクエストボディが必須かどうか
 * @param description - 説明
 * @returns IRRequestBodyModel
 *
 * @example OpenAPI YAML
 * ```yaml
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           name:
 *             type: string
 * # → PostUsersRequestBody model
 * ```
 */
export function transformRequestBodyObject(
  properties: Array<{
    name: string;
    type: unknown;
    required?: boolean;
    nullable?: boolean;
    description?: string;
  }>,
  context: VisitorContext,
  required?: boolean,
  description?: string,
): IRRequestBodyModel {
  // モデル名を生成（最後のセグメントを使用）
  const modelName = context.documentPath[context.documentPath.length - 1];
  const referencePath = buildReferencePath(context.documentPath);

  const model: IRRequestBodyModel = {
    kind: "requestBody",
    name: modelName,
    referencePath,
    properties: properties as IRRequestBodyModel["properties"],
    ...(required && { required: true }),
    ...(description && { description }),
  };

  return model;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("transformRequestBody", () => {
    it("should handle reference request body", () => {
      const requestBody = {
        $ref: "#/components/requestBodies/UserInput",
      } as ReferenceObject;

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post", "requestBody"],
        rootSegment: "paths",
      };

      const contentResult: ContentTraversalResult = {
        content: [],
        childModels: [],
        requiresSpecialModel: false,
      };

      const result = transformRequestBody(requestBody, context, contentResult);

      expect(result.type).toEqual({
        kind: "ref",
        ref: {
          kind: "ref",
          name: "#/components/requestBodies/UserInput",
        },
      });
      expect(result.models).toEqual([]);
    });

    it("should handle request body with content", () => {
      const requestBody: RequestBodyObject = {
        description: "User data",
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
              },
            },
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post", "requestBody"],
        rootSegment: "paths",
      };

      const contentResult: ContentTraversalResult = {
        content: [
          {
            mimeType: "application/json",
            schema: { kind: "ref", name: "#/paths/::users/post/requestBody" },
          },
        ],
        childModels: [],
        requiresSpecialModel: false,
      };

      const result = transformRequestBody(requestBody, context, contentResult);

      expect(result.type).toEqual({
        kind: "content",
        description: "User data",
        required: true,
        content: [
          {
            mimeType: "application/json",
            schema: { kind: "ref", name: "#/paths/::users/post/requestBody" },
          },
        ],
      });
      expect(result.models).toEqual([]);
    });

    it("should return null for empty content", () => {
      const requestBody: RequestBodyObject = {
        required: true,
        content: {},
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post", "requestBody"],
        rootSegment: "paths",
      };

      const contentResult: ContentTraversalResult = {
        content: [],
        childModels: [],
        requiresSpecialModel: false,
      };

      const result = transformRequestBody(requestBody, context, contentResult);

      expect(result.type).toBeNull();
      expect(result.models).toEqual([]);
    });

    it("should include child models from content", () => {
      const requestBody: RequestBodyObject = {
        required: false,
        content: {
          "application/json": {
            schema: { type: "object" },
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post", "requestBody"],
        rootSegment: "paths",
      };

      const mockModel: IRModel = {
        kind: "object",
        name: "TestModel",
        referencePath: "#/test",
        properties: [],
      };

      const contentResult: ContentTraversalResult = {
        content: [
          {
            mimeType: "application/json",
            schema: { kind: "ref", name: "#/test" },
          },
        ],
        childModels: [mockModel],
        requiresSpecialModel: false,
      };

      const result = transformRequestBody(requestBody, context, contentResult);

      expect(result.models).toHaveLength(1);
      expect(result.models[0]).toBe(mockModel);
    });
  });

  describe("transformRequestBodyObject", () => {
    it("should create IRRequestBodyModel", () => {
      const properties = [
        { name: "name", type: "string", required: true },
        { name: "email", type: "string" },
      ];

      const context: VisitorContext = {
        documentPath: [
          "paths",
          "/users",
          "post",
          "requestBody",
          "PostUsersRequestBody",
        ],
        rootSegment: "paths",
      };

      const result = transformRequestBodyObject(
        properties,
        context,
        true,
        "User data",
      );

      expect(result).toEqual({
        kind: "requestBody",
        name: "PostUsersRequestBody",
        referencePath: "#/paths/::users/post/requestBody/PostUsersRequestBody",
        properties: [
          { name: "name", type: "string", required: true },
          { name: "email", type: "string" },
        ],
        required: true,
        description: "User data",
      });
    });

    it("should handle optional request body", () => {
      const properties = [{ name: "data", type: "string" }];

      const context: VisitorContext = {
        documentPath: ["paths", "/data", "post", "requestBody", "DataModel"],
        rootSegment: "paths",
      };

      const result = transformRequestBodyObject(properties, context);

      expect(result.required).toBeUndefined();
      expect(result.description).toBeUndefined();
    });
  });
}
