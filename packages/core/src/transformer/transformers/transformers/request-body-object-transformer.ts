/**
 * Request Body Object Transformer - v2 Transformer Architecture
 *
 * Inline RequestBody ObjectをIRRequestBodyModelに変換します。
 */

import type {
  IRModel,
  IRProperty,
  IRRequestBodyModel,
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
 * Inline RequestBody ObjectをIRRequestBodyModelに変換
 *
 * @param schema - SchemaObject (inline object)
 * @param context - Visitorコンテキスト
 * @param propertyTraversalResult - property-traverserからの結果
 * @param additionalPropertiesResult - additionalProperties処理結果（オプション）
 * @returns 変換結果
 *
 * @example OpenAPI YAML
 * ```yaml
 * paths:
 *   /users:
 *     post:
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
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
  // contextからrequiredを取得（RequestBodyContextの場合）
  const hasRequired =
    (context.kind === "requestBody" ||
      context.kind === "componentsRequestBody") &&
    "required" in context &&
    context.required;

  const requestBodyModel: IRRequestBodyModel = {
    kind: "requestBody",
    name,
    referencePath,
    properties,
    ...(schema.description && { description: schema.description }),
    ...(additionalPropertiesResult?.type && {
      additionalProperties: additionalPropertiesResult.type,
    }),
    ...(hasRequired ? { required: true } : {}),
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

  type PathsRequestBodyContext = import("../../types").PathsRequestBodyContext;

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

    it("should preserve all property metadata (validation, extensions, readOnly, etc.)", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          username: {
            type: "string",
            minLength: 3,
            maxLength: 20,
          },
          bio: {
            type: "string",
            writeOnly: true,
          },
          createdAt: {
            type: "string",
            readOnly: true,
          },
        },
        required: ["username"],
        description: "Request with metadata",
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
            name: "bio",
            type: "string",
            writeOnly: true,
            validation: {
              maxLength: 500,
            },
          },
          {
            name: "createdAt",
            type: "string",
            readOnly: true,
            deprecated: true,
          },
        ],
        childModels: [],
      };

      const result = transformRequestBodyObject(
        schema,
        context,
        propertyResult,
      );

      expect(result.models).toHaveLength(1);
      const model = result.models[0];

      if (model.kind === "requestBody") {
        // username: validation + extensions が保持される
        expect(model.properties[0]).toEqual({
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

        // bio: writeOnly + validation が保持される
        expect(model.properties[1]).toEqual({
          name: "bio",
          type: "string",
          writeOnly: true,
          validation: {
            maxLength: 500,
          },
        });

        // createdAt: readOnly + deprecated が保持される
        expect(model.properties[2]).toEqual({
          name: "createdAt",
          type: "string",
          readOnly: true,
          deprecated: true,
        });
      }
    });

    it("should preserve defaultValue and complex validation metadata", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          age: {
            type: "integer",
            default: 18,
          },
          email: {
            type: "string",
            format: "email",
          },
        },
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
          {
            name: "age",
            type: "int",
            defaultValue: 18,
            validation: {
              minimum: 0,
              maximum: 150,
            },
            extensions: {
              "x-unit": "years",
            },
          },
          {
            name: "email",
            type: "string",
            validation: {
              format: "email",
              maxLength: 100,
            },
            extensions: {
              "x-unique": true,
            },
          },
        ],
        childModels: [],
      };

      const result = transformRequestBodyObject(
        schema,
        context,
        propertyResult,
      );

      expect(result.models).toHaveLength(1);
      const model = result.models[0];

      if (model.kind === "requestBody") {
        // age: defaultValue + validation + extensions が保持される
        expect(model.properties[0]).toEqual({
          name: "age",
          type: "int",
          defaultValue: 18,
          validation: {
            minimum: 0,
            maximum: 150,
          },
          extensions: {
            "x-unit": "years",
          },
        });

        // email: validation（format含む）+ extensions が保持される
        expect(model.properties[1]).toEqual({
          name: "email",
          type: "string",
          validation: {
            format: "email",
            maxLength: 100,
          },
          extensions: {
            "x-unique": true,
          },
        });
      }
    });

    it("should include required field in IRRequestBodyModel when provided in context", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          username: { type: "string" },
          email: { type: "string" },
        },
        required: ["username"],
      };

      const context: PathsRequestBodyContext = {
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
        contentType: "application/json",
        schemaPath: ["content", "application/json", "schema"],
        required: true,
      };

      const propertyResult: PropertyTraversalResult = {
        properties: [
          { name: "username", type: "string", required: true },
          { name: "email", type: "string" },
        ],
        childModels: [],
      };

      const result = transformRequestBodyObject(
        schema,
        context,
        propertyResult,
      );

      expect(result.models[0]).toMatchObject({
        kind: "requestBody",
        name: "PostUsersRequestBody",
        required: true,
        properties: [
          { name: "username", type: "string", required: true },
          { name: "email", type: "string" },
        ],
      });
    });
  });
}
