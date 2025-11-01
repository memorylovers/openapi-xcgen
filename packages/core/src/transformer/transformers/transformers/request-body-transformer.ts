/**
 * Request Body Transformer - v2 Transformer Architecture
 *
 * RequestBodyObjectをIRRequestBodyに変換します。
 * contentの処理はcontent-traverserに委譲します。
 */

import { consola } from "consola";
import type {
  IRModel,
  IRProperty,
  IRRef,
  IRRequestBody,
  IRRequestBodyModel,
  IRRequestContent,
  ReferenceObject,
  RequestBodyObject,
  SchemaObject,
} from "../../../types";
import { isReferenceObject } from "../../../types";
import { buildReferencePath, getModelName } from "../../helpers";
import type { VisitorContext } from "../../types";
import type {
  AdditionalPropertiesTraversalResult,
  ContentTraversalResult,
  PropertyTraversalResult,
  TransformResult,
} from "../types";

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
export function transformRequestBodyObject(
  schema: SchemaObject,
  context: VisitorContext,
  propertyTraversalResult: PropertyTraversalResult,
  additionalPropertiesResult?: AdditionalPropertiesTraversalResult,
): TransformResult {
  const name = getModelName(context);
  const referencePath = buildReferencePath(context.documentPath);

  // プロパティをIRProperty形式に変換
  const properties: IRProperty[] = propertyTraversalResult.properties.map(
    (prop) => ({
      name: prop.name,
      type: prop.type,
      ...(prop.required && { required: true as const }),
      ...(prop.nullable && { nullable: true as const }),
      ...(prop.description && { description: prop.description }),
      ...(prop.defaultValue !== undefined && {
        defaultValue: prop.defaultValue,
      }),
      ...(prop.deprecated && { deprecated: true as const }),
      ...(prop.readOnly && { readOnly: true as const }),
      ...(prop.writeOnly && { writeOnly: true as const }),
      ...(prop.validation && { validation: prop.validation }),
      ...(prop.extensions && { extensions: prop.extensions }),
    }),
  );

  // 子モデルの収集
  const childModels = [
    ...propertyTraversalResult.childModels,
    ...(additionalPropertiesResult?.models || []),
  ];

  // IRRequestBodyModelを作成
  const requestBodyModel: IRRequestBodyModel = {
    kind: "requestBody",
    name,
    referencePath,
    properties,
    ...(schema.description && { description: schema.description }),
    ...(additionalPropertiesResult?.type && {
      additionalProperties: additionalPropertiesResult.type,
    }),
  };

  // requestBodyモデルと子要素から抽出されたモデルを返す
  return {
    type: { kind: "ref", name: referencePath },
    models: [requestBodyModel, ...childModels],
  };
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
    it("should create IRRequestBodyModel from schema and traversal result", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
        },
        required: ["name"],
        description: "User data",
      };

      const context: VisitorContext = {
        kind: "requestBody",
        documentPath: [
          "paths",
          "/users",
          "post",
          "requestBody",
          "content",
          "application/json",
          "schema",
        ],
        rootSegment: "paths",
      };

      const propertyResult: PropertyTraversalResult = {
        properties: [
          { name: "name", type: "string", required: true },
          { name: "email", type: "string" },
        ],
        childModels: [],
      };

      const result = transformRequestBodyObject(
        schema,
        context,
        propertyResult,
      );

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/paths/::users/post/requestBody/content/application::json/schema",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0]).toEqual({
        kind: "requestBody",
        name: "PostUsersRequestBody",
        referencePath:
          "#/paths/::users/post/requestBody/content/application::json/schema",
        properties: [
          { name: "name", type: "string", required: true },
          { name: "email", type: "string" },
        ],
        description: "User data",
      });
    });

    it("should handle additionalProperties in request body", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        additionalProperties: { type: "string" },
      };

      const context: VisitorContext = {
        kind: "requestBody",
        documentPath: [
          "paths",
          "/data",
          "post",
          "requestBody",
          "content",
          "application/json",
          "schema",
        ],
        rootSegment: "paths",
      };

      const propertyResult: PropertyTraversalResult = {
        properties: [{ name: "id", type: "string" }],
        childModels: [],
      };

      const additionalResult: AdditionalPropertiesTraversalResult = {
        type: "string",
        models: [],
      };

      const result = transformRequestBodyObject(
        schema,
        context,
        propertyResult,
        additionalResult,
      );

      expect(result.models[0]).toMatchObject({
        kind: "requestBody",
        additionalProperties: "string",
      });
    });

    it("should collect child models from properties", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          nested: { type: "object" },
        },
      };

      const context: VisitorContext = {
        kind: "requestBody",
        documentPath: [
          "paths",
          "/test",
          "post",
          "requestBody",
          "content",
          "application/json",
          "schema",
        ],
        rootSegment: "paths",
      };

      const mockChildModel: IRModel = {
        kind: "object",
        name: "NestedModel",
        referencePath: "#/nested",
        properties: [],
      };

      const propertyResult: PropertyTraversalResult = {
        properties: [
          {
            name: "nested",
            type: { kind: "ref", name: "#/nested" },
          },
        ],
        childModels: [mockChildModel],
      };

      const result = transformRequestBodyObject(
        schema,
        context,
        propertyResult,
      );

      expect(result.models).toHaveLength(2); // requestBody + nested
      expect(result.models[1]).toBe(mockChildModel);
    });
  });
}
