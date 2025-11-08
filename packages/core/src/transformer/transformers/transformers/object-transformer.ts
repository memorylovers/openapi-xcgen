/**
 * Object Transformer - v2 Transformer Architecture
 *
 * ObjectスキーマをIRObjectSchemaに変換します。
 * トラバーサル（properties/additionalProperties訪問）は object-traverser に委譲します。
 */

import type { IRObjectSchema, IRProperty, SchemaObject } from "../../../types";
import { buildReferencePath, getComponentName } from "../../helpers";
import type { VisitorContext } from "../../types";
import type {
  AdditionalPropertiesTraversalResult,
  PropertyTraversalResult,
  TransformResult,
} from "../types";

/**
 * ObjectスキーマをIRObjectSchemaに変換
 *
 * @param schema - Objectスキーマ
 * @param context - Visitorコンテキスト
 * @param propertyTraversalResult - プロパティトラバーサル結果
 * @param additionalPropertiesResult - additionalPropertiesトラバーサル結果（オプショナル）
 * @returns 変換結果
 *
 * @example OpenAPI YAML
 * ```yaml
 * User:
 *   type: object
 *   required:
 *     - id
 *     - name
 *   properties:
 *     id:
 *       type: string
 *     name:
 *       type: string
 *     age:
 *       type: integer
 *   description: "User model"
 * ```
 *
 * @example OpenAPI YAML - additionalProperties付き
 * ```yaml
 * FlexibleUser:
 *   type: object
 *   properties:
 *     id:
 *       type: string
 *   additionalProperties:
 *     type: string
 * ```
 */
export function transformObject(
  schema: SchemaObject,
  context: VisitorContext,
  propertyTraversalResult: PropertyTraversalResult,
  additionalPropertiesResult?: AdditionalPropertiesTraversalResult,
): TransformResult {
  const name = getComponentName(context);
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
    ...(additionalPropertiesResult?.components || []),
  ];

  // IRObjectSchemaを作成
  const objectModel: IRObjectSchema = {
    kind: "object",
    name,
    referencePath,
    properties,
    ...(schema.description && { description: schema.description }),
    ...(additionalPropertiesResult?.type && {
      additionalProperties: additionalPropertiesResult.type,
    }),
  };

  // objectモデルと子要素から抽出されたモデルを返す
  return {
    type: { kind: "ref", referencePath: referencePath },
    components: [objectModel, ...childModels],
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("transformObject", () => {
    it("should create object model with primitive properties", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          age: { type: "integer" },
        },
        required: ["id", "name"],
        description: "User model",
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "User"],
        rootSegment: "components",
      };

      const propertyResult: PropertyTraversalResult = {
        properties: [
          { name: "id", type: "string", required: true },
          { name: "name", type: "string", required: true },
          { name: "age", type: "int" },
        ],
        childModels: [],
      };

      const result = transformObject(schema, context, propertyResult);

      expect(result.type).toEqual({
        kind: "ref",
        referencePath: "#/components/schemas/User",
      });
      expect(result.components).toHaveLength(1);
      if (result.components[0].kind === "object") {
        expect(result.components[0]).toEqual({
          kind: "object",
          name: "User",
          referencePath: "#/components/schemas/User",
          properties: [
            { name: "id", type: "string", required: true },
            { name: "name", type: "string", required: true },
            { name: "age", type: "int" },
          ],
          description: "User model",
        });
      }
    });

    it("should create object model with nullable properties", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          nickname: { type: "string", nullable: true },
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Profile"],
        rootSegment: "components",
      };

      const propertyResult: PropertyTraversalResult = {
        properties: [{ name: "nickname", type: "string", nullable: true }],
        childModels: [],
      };

      const result = transformObject(schema, context, propertyResult);

      if (result.components[0].kind === "object") {
        expect(result.components[0].properties).toEqual([
          { name: "nickname", type: "string", nullable: true },
        ]);
      }
    });

    it("should create object model with descriptions on properties", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          username: { type: "string", description: "User's login name" },
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Account"],
        rootSegment: "components",
      };

      const propertyResult: PropertyTraversalResult = {
        properties: [
          {
            name: "username",
            type: "string",
            description: "User's login name",
          },
        ],
        childModels: [],
      };

      const result = transformObject(schema, context, propertyResult);

      if (result.components[0].kind === "object") {
        expect(result.components[0].properties[0]).toEqual({
          name: "username",
          type: "string",
          description: "User's login name",
        });
      }
    });

    it("should create object model with additionalProperties", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        additionalProperties: { type: "string" },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "FlexibleUser"],
        rootSegment: "components",
      };

      const propertyResult: PropertyTraversalResult = {
        properties: [{ name: "id", type: "string" }],
        childModels: [],
      };

      const additionalResult: AdditionalPropertiesTraversalResult = {
        type: "string",
        components: [],
      };

      const result = transformObject(
        schema,
        context,
        propertyResult,
        additionalResult,
      );

      expect(result.components[0]).toEqual({
        kind: "object",
        name: "FlexibleUser",
        referencePath: "#/components/schemas/FlexibleUser",
        properties: [{ name: "id", type: "string" }],
        additionalProperties: "string",
      });
    });

    it("should create object model without additionalProperties when not provided", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "string" },
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "StrictUser"],
        rootSegment: "components",
      };

      const propertyResult: PropertyTraversalResult = {
        properties: [{ name: "id", type: "string" }],
        childModels: [],
      };

      const result = transformObject(schema, context, propertyResult);

      expect(result.components[0]).not.toHaveProperty("additionalProperties");
    });

    it("should collect child models from nested properties", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          address: {
            type: "object",
            properties: { street: { type: "string" } },
          },
          name: { type: "string" },
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Person"],
        rootSegment: "components",
      };

      const propertyResult: PropertyTraversalResult = {
        properties: [
          {
            name: "address",
            type: {
              kind: "ref",
              referencePath: "#/components/schemas/AddressModel",
            },
          },
          { name: "name", type: "string" },
        ],
        childModels: [
          {
            kind: "object",
            name: "AddressModel",
            referencePath: "#/components/schemas/AddressModel",
            properties: [{ name: "street", type: "string" }],
          },
        ],
      };

      const result = transformObject(schema, context, propertyResult);

      expect(result.components).toHaveLength(2); // Person + AddressModel
      expect(result.components[0].name).toBe("Person");
      expect(result.components[1].name).toBe("AddressModel");
    });

    it("should create object model with empty properties", () => {
      const schema: SchemaObject = {
        type: "object",
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "EmptyObject"],
        rootSegment: "components",
      };

      const propertyResult: PropertyTraversalResult = {
        properties: [],
        childModels: [],
      };

      const result = transformObject(schema, context, propertyResult);

      expect(result.components[0]).toEqual({
        kind: "object",
        name: "EmptyObject",
        referencePath: "#/components/schemas/EmptyObject",
        properties: [],
      });
    });

    it("should collect models from both properties and additionalProperties", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          tags: { type: "array", items: { type: "string" } },
        },
        additionalProperties: {
          type: "array",
          items: { type: "number" },
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "ComplexObject"],
        rootSegment: "components",
      };

      const propertyResult: PropertyTraversalResult = {
        properties: [
          {
            name: "tags",
            type: {
              kind: "ref",
              referencePath: "#/components/schemas/TagsArray",
            },
          },
        ],
        childModels: [
          {
            kind: "array",
            name: "TagsArray",
            referencePath: "#/components/schemas/TagsArray",
            itemType: "string",
          },
        ],
      };

      const additionalResult: AdditionalPropertiesTraversalResult = {
        type: {
          kind: "ref",
          referencePath: "#/components/schemas/NumberArray",
        },
        components: [
          {
            kind: "array",
            name: "NumberArray",
            referencePath: "#/components/schemas/NumberArray",
            itemType: { kind: "ref", referencePath: "number" },
          },
        ],
      };

      const result = transformObject(
        schema,
        context,
        propertyResult,
        additionalResult,
      );

      expect(result.components).toHaveLength(3); // ComplexObject + TagsArray + NumberArray
      expect(result.components[0].kind).toBe("object");
      expect(result.components[1].kind).toBe("array");
      expect(result.components[2].kind).toBe("array");
    });
  });
}
