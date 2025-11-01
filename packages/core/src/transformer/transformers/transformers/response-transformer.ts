/**
 * Response Transformer - v2 Transformer Architecture
 *
 * ResponseObjectをIRResponseに変換します。
 * contentの処理はcontent-traverserに、headersの処理はheaders-traverserに委譲します。
 */

import type {
  IRModel,
  IRProperty,
  IRRef,
  IRResponse,
  IRResponseContent,
  IRResponseHeader,
  IRResponseModel,
  ReferenceObject,
  ResponseObject,
  SchemaObject,
} from "../../../types";
import { isReferenceObject } from "../../../types";
import { buildReferencePath, getModelName } from "../../helpers";
import type { VisitorContext } from "../../types";
import type {
  AdditionalPropertiesTraversalResult,
  ContentTraversalResult,
  HeadersTraversalResult,
  PropertyTraversalResult,
  TransformResult,
} from "../types";

/**
 * ResponseObjectをIRResponseに変換
 *
 * @param response - ResponseObjectまたはReferenceObject
 * @param statusCode - HTTPステータスコード（"200", "404", "default"など）
 * @param context - Visitorコンテキスト
 * @param contentResult - content-traverserからの結果（オプション）
 * @param headersResult - headers-traverserからの結果（オプション）
 * @returns 変換結果
 *
 * @example OpenAPI YAML
 * ```yaml
 * responses:
 *   '200':
 *     description: Success
 *     headers:
 *       X-Total-Count:
 *         schema:
 *           type: integer
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             result:
 *               type: string
 * ```
 */
export function transformResponse(
  response: ResponseObject | ReferenceObject,
  statusCode: string,
  context: VisitorContext,
  contentResult?: ContentTraversalResult,
  headersResult?: HeadersTraversalResult,
): TransformResult {
  // ReferenceObjectの場合
  if (isReferenceObject(response)) {
    const ref: IRRef = {
      kind: "ref",
      name: response.$ref,
    };

    const irResponse: IRResponse = {
      kind: "ref",
      statusCode,
      ref,
    };

    return {
      // NOTE: IRResponseはIRTypeに含まれないが、Operation系の特別な型として扱う
      // TransformResultインターフェースは汎用的なため、型の妥協が必要
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: irResponse as any,
      models: [],
    };
  }

  // ResponseObjectとして処理
  const responseObj = response;

  // IRResponseContentに変換
  const irContent: IRResponseContent[] | undefined =
    contentResult && contentResult.content.length > 0
      ? contentResult.content.map((c) => ({
          mimeType: c.mimeType,
          schema: c.schema,
        }))
      : undefined;

  // IRResponseHeaderに変換
  const irHeaders: IRResponseHeader[] | undefined =
    headersResult && headersResult.headers.length > 0
      ? headersResult.headers.map((h) => ({
          name: h.name,
          type: h.type,
          ...(h.description && { description: h.description }),
          ...(h.defaultValue !== undefined && {
            defaultValue: h.defaultValue,
          }),
          ...(h.deprecated && { deprecated: true }),
        }))
      : undefined;

  // IRResponseを構築
  const irResponse: IRResponse = {
    kind: "content",
    statusCode,
    ...(responseObj.description && { description: responseObj.description }),
    ...(irContent && { content: irContent }),
    ...(irHeaders && { headers: irHeaders }),
  };

  // 子モデルを収集
  const childModels = [
    ...(contentResult?.childModels || []),
    ...(headersResult?.childModels || []),
  ];

  return {
    // NOTE: IRResponseはIRTypeに含まれないが、Operation系の特別な型として扱う
    // TransformResultインターフェースは汎用的なため、型の妥協が必要
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: irResponse as any,
    models: childModels,
  };
}

/**
 * インラインobjectスキーマからIRResponseModelを生成
 *
 * 3層アーキテクチャに準拠: SchemaObject と PropertyTraversalResult を受け取り、
 * TransformResult を返します。
 *
 * @param schema - ObjectスキーマまたはSchemaObject
 * @param context - Visitorコンテキスト（kind: "response" または "componentsResponse"）
 * @param propertyTraversalResult - プロパティトラバーサル結果
 * @param additionalPropertiesResult - additionalPropertiesトラバーサル結果（オプション）
 * @returns TransformResult
 *
 * @example OpenAPI YAML
 * ```yaml
 * responses:
 *   '200':
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             result:
 *               type: string
 * # → GetUsers200Response model (kind: "response")
 * ```
 */
export function transformResponseObject(
  schema: SchemaObject,
  context: VisitorContext,
  propertyTraversalResult: PropertyTraversalResult,
  additionalPropertiesResult?: AdditionalPropertiesTraversalResult,
): TransformResult {
  const name = getModelName(context);
  const referencePath = buildReferencePath(context.documentPath);

  // ステータスコードを取得（documentPathから）
  const responsesIndex = context.documentPath.findIndex(
    (p) => p === "responses",
  );
  const statusCode = context.documentPath[responsesIndex + 1] as string;

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

  // IRResponseModelを作成
  const responseModel: IRResponseModel = {
    kind: "response",
    name,
    referencePath,
    properties,
    statusCode,
    ...(schema.description && { description: schema.description }),
    ...(additionalPropertiesResult?.type && {
      additionalProperties: additionalPropertiesResult.type,
    }),
  };

  // responseモデルと子要素から抽出されたモデルを返す
  return {
    type: { kind: "ref", name: referencePath },
    models: [responseModel, ...childModels],
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("transformResponse", () => {
    it("should handle reference response", () => {
      const response = {
        $ref: "#/components/responses/SuccessResponse",
      } as ReferenceObject;

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      };

      const result = transformResponse(response, "200", context);

      expect(result.type).toEqual({
        kind: "ref",
        statusCode: "200",
        ref: {
          kind: "ref",
          name: "#/components/responses/SuccessResponse",
        },
      });
      expect(result.models).toEqual([]);
    });

    it("should handle response with content only", () => {
      const response: ResponseObject = {
        description: "Success",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                result: { type: "string" },
              },
            },
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      };

      const contentResult: ContentTraversalResult = {
        content: [
          {
            mimeType: "application/json",
            schema: {
              kind: "ref",
              name: "#/paths/::users/get/responses/200",
            },
          },
        ],
        childModels: [],
        requiresSpecialModel: false,
      };

      const result = transformResponse(response, "200", context, contentResult);

      expect(result.type).toEqual({
        kind: "content",
        statusCode: "200",
        description: "Success",
        content: [
          {
            mimeType: "application/json",
            schema: {
              kind: "ref",
              name: "#/paths/::users/get/responses/200",
            },
          },
        ],
      });
      expect(result.models).toEqual([]);
    });

    it("should handle response with headers", () => {
      const response: ResponseObject = {
        description: "Success",
        headers: {
          "X-Total-Count": {
            schema: { type: "integer" },
          },
        },
        content: {
          "application/json": {
            schema: { type: "array", items: { type: "string" } },
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      };

      const contentResult: ContentTraversalResult = {
        content: [
          {
            mimeType: "application/json",
            schema: { kind: "ref", name: "#/test" },
          },
        ],
        childModels: [],
        requiresSpecialModel: false,
      };

      const headersResult: HeadersTraversalResult = {
        headers: [
          {
            name: "X-Total-Count",
            type: "int",
            description: "Total count",
          },
        ],
        childModels: [],
      };

      const result = transformResponse(
        response,
        "200",
        context,
        contentResult,
        headersResult,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseType = result.type as any as IRResponse;
      expect(responseType.kind).toBe("content");
      if (responseType.kind === "content") {
        expect(responseType.headers).toHaveLength(1);
        expect(responseType.headers?.[0]).toEqual({
          name: "X-Total-Count",
          type: "int",
          description: "Total count",
        });
      }
    });

    it("should handle response without content", () => {
      const response: ResponseObject = {
        description: "No content",
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "delete", "responses", "204"],
        rootSegment: "paths",
      };

      const result = transformResponse(response, "204", context);

      expect(result.type).toEqual({
        kind: "content",
        statusCode: "204",
        description: "No content",
      });
      expect(result.models).toEqual([]);
    });

    it("should collect child models from content and headers", () => {
      const response: ResponseObject = {
        description: "Success",
        content: {
          "application/json": {
            schema: { type: "object" },
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      };

      const mockContentModel: IRModel = {
        kind: "object",
        name: "ContentModel",
        referencePath: "#/content",
        properties: [],
      };

      const mockHeaderModel: IRModel = {
        kind: "object",
        name: "HeaderModel",
        referencePath: "#/header",
        properties: [],
      };

      const contentResult: ContentTraversalResult = {
        content: [
          {
            mimeType: "application/json",
            schema: { kind: "ref", name: "#/content" },
          },
        ],
        childModels: [mockContentModel],
        requiresSpecialModel: false,
      };

      const headersResult: HeadersTraversalResult = {
        headers: [],
        childModels: [mockHeaderModel],
      };

      const result = transformResponse(
        response,
        "200",
        context,
        contentResult,
        headersResult,
      );

      expect(result.models).toHaveLength(2);
      expect(result.models).toContain(mockContentModel);
      expect(result.models).toContain(mockHeaderModel);
    });
  });

  describe("transformResponseObject", () => {
    it("should create IRResponseModel from schema and traversal result", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          result: { type: "string" },
          count: { type: "integer" },
        },
        required: ["result"],
        description: "Success response",
      };

      const context: VisitorContext = {
        kind: "response",
        documentPath: [
          "paths",
          "/users",
          "get",
          "responses",
          "200",
          "content",
          "application/json",
          "schema",
        ],
        rootSegment: "paths",
      };

      const propertyResult: PropertyTraversalResult = {
        properties: [
          { name: "result", type: "string", required: true },
          { name: "count", type: "int" },
        ],
        childModels: [],
      };

      const result = transformResponseObject(schema, context, propertyResult);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/paths/::users/get/responses/200/content/application::json/schema",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0]).toEqual({
        kind: "response",
        name: "GetUsers200Response",
        referencePath:
          "#/paths/::users/get/responses/200/content/application::json/schema",
        properties: [
          { name: "result", type: "string", required: true },
          { name: "count", type: "int" },
        ],
        statusCode: "200",
        description: "Success response",
      });
    });

    it("should handle additionalProperties in response", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        additionalProperties: { type: "number" },
      };

      const context: VisitorContext = {
        kind: "response",
        documentPath: [
          "paths",
          "/data",
          "get",
          "responses",
          "200",
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
        type: "double", // number -> double in IR
        models: [],
      };

      const result = transformResponseObject(
        schema,
        context,
        propertyResult,
        additionalResult,
      );

      expect(result.models[0]).toMatchObject({
        kind: "response",
        additionalProperties: "double",
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
        kind: "response",
        documentPath: [
          "paths",
          "/test",
          "get",
          "responses",
          "200",
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

      const result = transformResponseObject(schema, context, propertyResult);

      expect(result.models).toHaveLength(2); // response + nested
      expect(result.models[1]).toBe(mockChildModel);
    });

    it("should handle different status codes", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      };

      const context: VisitorContext = {
        kind: "response",
        documentPath: [
          "paths",
          "/users/{id}",
          "get",
          "responses",
          "404",
          "content",
          "application/json",
          "schema",
        ],
        rootSegment: "paths",
      };

      const propertyResult: PropertyTraversalResult = {
        properties: [{ name: "error", type: "string" }],
        childModels: [],
      };

      const result = transformResponseObject(schema, context, propertyResult);

      expect(result.models[0]).toMatchObject({
        kind: "response",
        name: "GetUsersId404Response",
        statusCode: "404",
      });
    });

    it("should preserve all property metadata (validation, extensions, readOnly, etc.)", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: {
            type: "integer",
            readOnly: true,
          },
          username: {
            type: "string",
          },
          createdAt: {
            type: "string",
            deprecated: true,
          },
        },
        description: "Response with metadata",
      };

      const context: VisitorContext = {
        kind: "response",
        documentPath: [
          "paths",
          "/users/{id}",
          "get",
          "responses",
          "200",
          "content",
          "application/json",
          "schema",
        ],
        rootSegment: "paths",
      };

      const propertyResult: PropertyTraversalResult = {
        properties: [
          {
            name: "id",
            type: "long",
            readOnly: true,
            validation: {
              format: "int64",
            },
            extensions: {
              "x-database-column": "user_id",
              "x-primary-key": true,
            },
          },
          {
            name: "username",
            type: "string",
            required: true,
            validation: {
              minLength: 3,
              maxLength: 20,
              pattern: "^[a-zA-Z0-9_]+$",
            },
            extensions: {
              "x-validation-message": "Username must be 3-20 characters",
            },
          },
          {
            name: "createdAt",
            type: "string",
            deprecated: true,
            extensions: {
              "x-deprecated-reason": "Use createdAtUtc instead",
            },
          },
        ],
        childModels: [],
      };

      const result = transformResponseObject(schema, context, propertyResult);

      expect(result.models).toHaveLength(1);
      const model = result.models[0];

      if (model.kind === "response") {
        // id: readOnly + validation + extensions が保持される
        expect(model.properties[0]).toEqual({
          name: "id",
          type: "long",
          readOnly: true,
          validation: {
            format: "int64",
          },
          extensions: {
            "x-database-column": "user_id",
            "x-primary-key": true,
          },
        });

        // username: required + validation + extensions が保持される
        expect(model.properties[1]).toEqual({
          name: "username",
          type: "string",
          required: true,
          validation: {
            minLength: 3,
            maxLength: 20,
            pattern: "^[a-zA-Z0-9_]+$",
          },
          extensions: {
            "x-validation-message": "Username must be 3-20 characters",
          },
        });

        // createdAt: deprecated + extensions が保持される
        expect(model.properties[2]).toEqual({
          name: "createdAt",
          type: "string",
          deprecated: true,
          extensions: {
            "x-deprecated-reason": "Use createdAtUtc instead",
          },
        });
      }
    });

    it("should preserve defaultValue and writeOnly in response metadata", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          score: {
            type: "number",
            default: 0.0,
          },
          email: {
            type: "string",
            writeOnly: true,
          },
        },
      };

      const context: VisitorContext = {
        kind: "response",
        documentPath: [
          "paths",
          "/users",
          "get",
          "responses",
          "200",
          "content",
          "application/json",
          "schema",
        ],
        rootSegment: "paths",
      };

      const propertyResult: PropertyTraversalResult = {
        properties: [
          {
            name: "score",
            type: "double",
            defaultValue: 0.0,
            validation: {
              minimum: 0.0,
              maximum: 100.0,
            },
            extensions: {
              "x-precision": 1,
            },
          },
          {
            name: "email",
            type: "string",
            nullable: true,
            writeOnly: true,
            validation: {
              format: "email",
              maxLength: 100,
            },
          },
        ],
        childModels: [],
      };

      const result = transformResponseObject(schema, context, propertyResult);

      expect(result.models).toHaveLength(1);
      const model = result.models[0];

      if (model.kind === "response") {
        // score: defaultValue + validation + extensions が保持される
        expect(model.properties[0]).toEqual({
          name: "score",
          type: "double",
          defaultValue: 0.0,
          validation: {
            minimum: 0.0,
            maximum: 100.0,
          },
          extensions: {
            "x-precision": 1,
          },
        });

        // email: nullable + writeOnly + validation が保持される
        expect(model.properties[1]).toEqual({
          name: "email",
          type: "string",
          nullable: true,
          writeOnly: true,
          validation: {
            format: "email",
            maxLength: 100,
          },
        });
      }
    });
  });
}
