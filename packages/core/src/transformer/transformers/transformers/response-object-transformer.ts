/**
 * Response Object Transformer - v2 Transformer Architecture
 *
 * Inline Response ObjectをIRResponseModelに変換します。
 */

import type {
  IRModel,
  IRProperty,
  IRResponseModel,
  SchemaObject,
} from "../../../types";
import { buildReferencePath, getModelName } from "../../helpers";
import type { VisitorContext } from "../../types";
import type {
  AdditionalPropertiesTraversalResult,
  PropertyTraversalResult,
  TransformResult,
} from "../types";

/**
 * Inline Response ObjectをIRResponseModelに変換
 *
 * @param schema - SchemaObject (inline object)
 * @param context - Visitorコンテキスト
 * @param propertyTraversalResult - property-traverserからの結果
 * @param additionalPropertiesResult - additionalProperties処理結果（オプション）
 * @returns 変換結果
 *
 * @example OpenAPI YAML
 * \`\`\`yaml
 * paths:
 *   /users:
 *     get:
 *       responses:
 *         '200':
 *           description: Success
 *           headers:
 *             X-Total-Count:
 *               schema:
 *                 type: integer
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   users:
 *                     type: array
 *                     items:
 *                       \$ref: '#/components/schemas/User'
 * \`\`\`
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
  // components.responsesの場合は空文字列、paths.responsesの場合はHTTPステータスコードを取得
  let statusCode: string;

  if (context.kind === "componentsResponse") {
    // components.responsesはHTTPステータスコードを持たない
    // documentPath例: ["components", "responses", "BadRequest", "content", ...]
    statusCode = "";
  } else {
    // paths.responsesはHTTPステータスコードを持つ
    // documentPath例: ["paths", "/users", "get", "responses", "200", "content", ...]
    const responsesIndex = context.documentPath.findIndex(
      (p) => p === "responses",
    );
    statusCode = context.documentPath[responsesIndex + 1] as string;
  }

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
  // contextからheadersを取得（ResponseContextの場合）
  const contextHeaders =
    (context.kind === "response" || context.kind === "componentsResponse") &&
    "headers" in context &&
    context.headers &&
    Array.isArray(context.headers)
      ? context.headers
      : undefined;

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
    ...(contextHeaders && contextHeaders.length > 0
      ? { headers: contextHeaders }
      : {}),
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

  type PathsResponseContext = import("../../types").PathsResponseContext;
  type IRType = import("../../../types").IRType;

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

    it("should handle components.responses inline object with empty statusCode", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" },
        },
        required: ["error", "message"],
        description: "Bad Request Error",
      };

      const context: VisitorContext = {
        kind: "componentsResponse",
        documentPath: [
          "components",
          "responses",
          "BadRequest",
          "content",
          "application/json",
          "schema",
        ],
        rootSegment: "components",
      };

      const propertyResult: PropertyTraversalResult = {
        properties: [
          { name: "error", type: "string", required: true },
          { name: "message", type: "string", required: true },
        ],
        childModels: [],
      };

      const result = transformResponseObject(schema, context, propertyResult);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/responses/BadRequest/content/application::json/schema",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0]).toEqual({
        kind: "response",
        name: "BadRequest",
        referencePath:
          "#/components/responses/BadRequest/content/application::json/schema",
        properties: [
          { name: "error", type: "string", required: true },
          { name: "message", type: "string", required: true },
        ],
        statusCode: "", // NOT "BadRequest"!
        description: "Bad Request Error",
      });
    });

    it("should include headers in IRResponseModel when provided in context", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
        },
        required: ["id"],
      };

      const headers = [
        {
          name: "Location",
          type: "string" as IRType,
          description: "URL of the created resource",
        },
        {
          name: "X-Request-ID",
          type: "string" as IRType,
        },
      ];

      const context: PathsResponseContext = {
        kind: "response",
        documentPath: [
          "paths",
          "/users",
          "post",
          "responses",
          "201",
          "content",
          "application/json",
          "schema",
        ],
        rootSegment: "paths",
        contentType: "application/json",
        schemaPath: ["content", "application/json", "schema"],
        headers,
      };

      const propertyResult: PropertyTraversalResult = {
        properties: [
          { name: "id", type: "string", required: true },
          { name: "name", type: "string" },
        ],
        childModels: [],
      };

      const result = transformResponseObject(schema, context, propertyResult);

      expect(result.models[0]).toMatchObject({
        kind: "response",
        name: "PostUsers201Response",
        statusCode: "201",
        headers,
        properties: [
          { name: "id", type: "string", required: true },
          { name: "name", type: "string" },
        ],
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
