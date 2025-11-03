/**
 * Request Body Transformer - v2 Transformer Architecture
 *
 * RequestBodyObjectをIRRequestBodyに変換します。
 * contentの処理はcontent-traverserに委譲します。
 */

import { consola } from "consola";
import type {
  IRRef,
  IRRequestBody,
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
      // NOTE: IRRequestBodyはIRTypeに含まれないが、Operation系の特別な型として扱う
      // TransformResultインターフェースは汎用的なため、型の妥協が必要
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: irRequestBody as any,
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
    // NOTE: IRRequestBodyはIRTypeに含まれないが、Operation系の特別な型として扱う
    // TransformResultインターフェースは汎用的なため、型の妥協が必要
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: irRequestBody as any,
    models: contentResult.childModels,
  };
}

/**
 * インラインobjectスキーマからIRRequestBodyModelを生成
 *
 * 3層アーキテクチャに準拠: SchemaObject と PropertyTraversalResult を受け取り、
 * TransformResult を返します。
 *
 * @param schema - ObjectスキーマまたはSchemaObject
 * @param context - Visitorコンテキスト（kind: "requestBody" または "componentsRequestBody"）
 * @param propertyTraversalResult - プロパティトラバーサル結果
 * @param additionalPropertiesResult - additionalPropertiesトラバーサル結果（オプション）
 * @returns TransformResult
 *
 * @example OpenAPI YAML
 * ```yaml
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           name:
 *             type: string
 * # → PostUsersRequestBody model (kind: "requestBody")
 * ```
 */
// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;
  type IRModel = import("../../../types").IRModel;

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
}
