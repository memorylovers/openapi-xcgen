/**
 * Object Traverser - v2 Transformer Architecture
 *
 * Object型スキーマのプロパティとadditionalPropertiesを訪問し、
 * 各プロパティの型と抽出されたモデルを返します。
 * 変換処理は object-transformer に委譲します。
 */

import { consola } from "consola";
import type {
  ReferenceObject,
  SchemaObject,
  SchemaObjectWithNullable,
} from "../../../types";
import { buildReferencePath, getModelName } from "../../helpers";
import type { VisitorContext } from "../../types";
import type {
  AdditionalPropertiesTraversalResult,
  PropertyTraversalResult,
} from "../types";

/**
 * スキーマ訪問関数の型
 */
type VisitSchemaFn = (
  schema: SchemaObjectWithNullable | ReferenceObject,
  context: VisitorContext,
) => { type: unknown; models: unknown[] };

/**
 * Object型スキーマのpropertiesを訪問
 *
 * @param schema - Objectスキーマ
 * @param context - 親コンテキスト
 * @param visitSchema - スキーマ訪問関数（再帰用）
 * @returns プロパティトラバーサル結果
 */
export function traverseObjectProperties(
  schema: SchemaObject & {
    properties?: Record<string, SchemaObjectWithNullable | ReferenceObject>;
    required?: string[];
  },
  context: VisitorContext,
  visitSchema: VisitSchemaFn,
): PropertyTraversalResult {
  const properties = schema.properties;

  // propertiesが未定義または空の場合
  if (!properties || Object.keys(properties).length === 0) {
    return {
      properties: [],
      childModels: [],
    };
  }

  const requiredSet = new Set(schema.required || []);
  const visitedProperties: PropertyTraversalResult["properties"] = [];
  const allChildModels: unknown[] = [];

  // 各プロパティを訪問
  Object.entries(properties).forEach(([propName, propSchema]) => {
    const propContext: VisitorContext = {
      documentPath: [...context.documentPath, "properties", propName],
      rootSegment: context.rootSegment,
    };

    const result = visitSchema(propSchema, propContext);

    if (!result.type) {
      const referencePath = buildReferencePath(propContext.documentPath);
      consola.warn(`Failed to resolve property type: ${referencePath}`);
      return; // このプロパティはスキップ
    }

    // nullable判定
    let nullable = false;
    if ("nullable" in propSchema && propSchema.nullable === true) {
      nullable = true;
    }
    // OpenAPI 3.1: type配列に"null"が含まれる場合
    if (
      "type" in propSchema &&
      Array.isArray(propSchema.type) &&
      propSchema.type.includes("null")
    ) {
      nullable = true;
    }

    visitedProperties.push({
      name: propName,
      type: result.type as PropertyTraversalResult["properties"][0]["type"],
      ...(requiredSet.has(propName) && { required: true }),
      ...(nullable && { nullable: true }),
      ...("description" in propSchema &&
        propSchema.description && { description: propSchema.description }),
    });

    allChildModels.push(...result.models);
  });

  return {
    properties: visitedProperties,
    childModels: allChildModels as PropertyTraversalResult["childModels"],
  };
}

/**
 * Object型スキーマのadditionalPropertiesを訪問
 * （propertiesと共存する場合）
 *
 * @param schema - Objectスキーマ
 * @param context - 親コンテキスト
 * @param visitSchema - スキーマ訪問関数（再帰用）
 * @returns additionalPropertiesトラバーサル結果
 */
export function traverseObjectAdditionalProperties(
  schema: SchemaObject & {
    additionalProperties?: boolean | SchemaObjectWithNullable | ReferenceObject;
  },
  context: VisitorContext,
  visitSchema: VisitSchemaFn,
): AdditionalPropertiesTraversalResult {
  const additional = schema.additionalProperties;

  // additionalProperties が undefined の場合
  if (additional === undefined) {
    return {
      type: undefined,
      models: [],
    };
  }

  // additionalProperties: true の場合（any型、サポート外）
  if (additional === true) {
    consola.warn(
      "additionalProperties: true (any type) is not supported in object schemas",
    );
    return {
      type: undefined,
      models: [],
    };
  }

  // additionalProperties: false の場合
  if (additional === false) {
    return {
      type: undefined,
      models: [],
    };
  }

  // additionalProperties にスキーマが指定されている場合
  const name = getModelName(context);
  const valueContext: VisitorContext = {
    documentPath: [
      ...context.documentPath.slice(0, -1),
      `${name}AdditionalValue`,
    ],
    rootSegment: context.rootSegment,
  };

  const valueResult = visitSchema(additional, valueContext);

  if (!valueResult.type) {
    const referencePath = buildReferencePath(context.documentPath);
    consola.warn(
      `Failed to process additionalProperties in object: ${referencePath}`,
    );
    return {
      type: undefined,
      models: [],
    };
  }

  return {
    type: valueResult.type as AdditionalPropertiesTraversalResult["type"],
    models: valueResult.models as AdditionalPropertiesTraversalResult["models"],
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("traverseObjectProperties", () => {
    it("should traverse properties with primitive types", () => {
      const mockVisitSchema = vi
        .fn()
        .mockReturnValueOnce({
          type: "string",
          models: [],
        })
        .mockReturnValueOnce({
          type: "number",
          models: [],
        });

      const schema: SchemaObject = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name"],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "User"],
        rootSegment: "components",
      };

      const result = traverseObjectProperties(schema, context, mockVisitSchema);

      expect(result.properties).toHaveLength(2);
      expect(result.properties[0]).toEqual({
        name: "name",
        type: "string",
        required: true,
      });
      expect(result.properties[1]).toEqual({
        name: "age",
        type: "number",
      });
      expect(result.childModels).toEqual([]);
    });

    it("should handle nullable properties (OpenAPI 3.0)", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "string",
        models: [],
      });

      const schema = {
        type: "object" as const,
        properties: {
          nickname: { type: "string" as const, nullable: true },
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Profile"],
        rootSegment: "components",
      };

      const result = traverseObjectProperties(schema, context, mockVisitSchema);

      expect(result.properties[0]).toEqual({
        name: "nickname",
        type: "string",
        nullable: true,
      });
    });

    it("should handle type array with null (OpenAPI 3.1)", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "string",
        models: [],
      });

      const schema = {
        type: "object" as const,
        properties: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          email: { type: ["string", "null"] as any },
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Contact"],
        rootSegment: "components",
      };

      const result = traverseObjectProperties(schema, context, mockVisitSchema);

      expect(result.properties[0]).toEqual({
        name: "email",
        type: "string",
        nullable: true,
      });
    });

    it("should handle properties with descriptions", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "string",
        models: [],
      });

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

      const result = traverseObjectProperties(schema, context, mockVisitSchema);

      expect(result.properties[0]).toEqual({
        name: "username",
        type: "string",
        description: "User's login name",
      });
    });

    it("should return empty when properties is undefined", () => {
      const mockVisitSchema = vi.fn();

      const schema: SchemaObject = {
        type: "object",
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Empty"],
        rootSegment: "components",
      };

      const result = traverseObjectProperties(schema, context, mockVisitSchema);

      expect(result.properties).toEqual([]);
      expect(result.childModels).toEqual([]);
      expect(mockVisitSchema).not.toHaveBeenCalled();
    });

    it("should skip failed properties but continue with successful ones", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const mockVisitSchema = vi
        .fn()
        .mockReturnValueOnce({
          type: "string",
          models: [],
        })
        .mockReturnValueOnce({
          type: null, // 失敗
          models: [],
        })
        .mockReturnValueOnce({
          type: "number",
          models: [],
        });

      const schema: SchemaObject = {
        type: "object",
        properties: {
          name: { type: "string" },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          invalid: { type: "invalid" } as any,
          age: { type: "number" },
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Mixed"],
        rootSegment: "components",
      };

      const result = traverseObjectProperties(schema, context, mockVisitSchema);

      expect(result.properties).toHaveLength(2);
      expect(result.properties.map((p) => p.name)).toEqual(["name", "age"]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to resolve property type"),
      );

      warnSpy.mockRestore();
    });

    it("should collect child models from nested schemas", () => {
      const mockVisitSchema = vi
        .fn()
        .mockReturnValueOnce({
          type: { kind: "ref", name: "#/components/schemas/AddressModel" },
          models: [
            {
              kind: "object",
              name: "AddressModel",
              referencePath: "#/components/schemas/AddressModel",
              properties: [{ name: "street", type: "string" }],
            },
          ],
        })
        .mockReturnValueOnce({
          type: "string",
          models: [],
        });

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

      const result = traverseObjectProperties(schema, context, mockVisitSchema);

      expect(result.properties).toHaveLength(2);
      expect(result.childModels).toHaveLength(1);
      expect(result.childModels[0].kind).toBe("object");
    });
  });

  describe("traverseObjectAdditionalProperties", () => {
    it("should traverse additionalProperties with schema", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "string",
        models: [],
      });

      const schema: SchemaObject = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
        additionalProperties: { type: "string" },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "FlexibleObject"],
        rootSegment: "components",
      };

      const result = traverseObjectAdditionalProperties(
        schema,
        context,
        mockVisitSchema,
      );

      expect(result.type).toBe("string");
      expect(result.models).toEqual([]);
    });

    it("should return undefined when additionalProperties is missing", () => {
      const mockVisitSchema = vi.fn();

      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "string" },
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Strict"],
        rootSegment: "components",
      };

      const result = traverseObjectAdditionalProperties(
        schema,
        context,
        mockVisitSchema,
      );

      expect(result.type).toBeUndefined();
      expect(result.models).toEqual([]);
      expect(mockVisitSchema).not.toHaveBeenCalled();
    });

    it("should warn when additionalProperties is true", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const mockVisitSchema = vi.fn();

      const schema: SchemaObject = {
        type: "object",
        additionalProperties: true,
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "AnyExtra"],
        rootSegment: "components",
      };

      const result = traverseObjectAdditionalProperties(
        schema,
        context,
        mockVisitSchema,
      );

      expect(result.type).toBeUndefined();
      expect(warnSpy).toHaveBeenCalledWith(
        "additionalProperties: true (any type) is not supported in object schemas",
      );

      warnSpy.mockRestore();
    });

    it("should return undefined when additionalProperties is false", () => {
      const mockVisitSchema = vi.fn();

      const schema: SchemaObject = {
        type: "object",
        additionalProperties: false,
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Sealed"],
        rootSegment: "components",
      };

      const result = traverseObjectAdditionalProperties(
        schema,
        context,
        mockVisitSchema,
      );

      expect(result.type).toBeUndefined();
      expect(result.models).toEqual([]);
      expect(mockVisitSchema).not.toHaveBeenCalled();
    });

    it("should warn when additionalProperties value type resolution fails", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: null,
        models: [],
      });

      const schema: SchemaObject = {
        type: "object",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        additionalProperties: { type: "invalid" } as any,
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "FailedExtra"],
        rootSegment: "components",
      };

      const result = traverseObjectAdditionalProperties(
        schema,
        context,
        mockVisitSchema,
      );

      expect(result.type).toBeUndefined();
      expect(result.models).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        "Failed to process additionalProperties in object: #/components/schemas/FailedExtra",
      );

      warnSpy.mockRestore();
    });
  });
}
