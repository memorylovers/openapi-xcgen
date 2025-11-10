/**
 * Object Traverser - v2 Transformer Architecture
 *
 * Object型スキーマのプロパティとadditionalPropertiesを訪問し、
 * 各プロパティの型と抽出されたモデルを返します。
 * 変換処理は object-transformer に委譲します。
 */

import { consola } from "consola";
import { pascalCase } from "es-toolkit/string";
import type {
  ReferenceObject,
  SchemaObject,
  SchemaObjectWithNullable,
} from "../../../types";
import {
  buildInlineSchemaPath,
  buildReferencePath,
  extractExtensions,
  extractValidation,
  getComponentName,
} from "../../helpers";
import type { VisitorContext } from "../../types";
import { createAdditionalPropertiesTraversalError } from "../errors";
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
) => { type: unknown; components: unknown[] };

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
    // プロパティ名を含む適切なコンポーネント名を生成
    const parentName = getComponentName(context);
    const propTypeName = `${parentName}${pascalCase(propName)}`;

    // 適切なdocumentPathを構築
    const propContext: VisitorContext = {
      documentPath: buildInlineSchemaPath(context, propTypeName),
      rootSegment: context.rootSegment,
    };

    const result = visitSchema(propSchema, propContext);

    if (!result.type) {
      // プロパティの型解決に失敗した場合はスキップ
      // エラーはvisitSchema内で既に報告済み
      return;
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

    // メタデータ抽出
    const validation = extractValidation(propSchema);
    const extensions = extractExtensions(propSchema);

    visitedProperties.push({
      name: propName,
      type: result.type as PropertyTraversalResult["properties"][0]["type"],
      ...(requiredSet.has(propName) && { required: true }),
      ...(nullable && { nullable: true }),
      ...("description" in propSchema &&
        propSchema.description && { description: propSchema.description }),
      ...("default" in propSchema &&
        propSchema.default !== undefined && {
          defaultValue: propSchema.default,
        }),
      ...("deprecated" in propSchema &&
        propSchema.deprecated === true && { deprecated: true }),
      ...("readOnly" in propSchema &&
        propSchema.readOnly === true && { readOnly: true }),
      ...("writeOnly" in propSchema &&
        propSchema.writeOnly === true && { writeOnly: true }),
      ...(validation && { validation }),
      ...(extensions && { extensions }),
    });

    allChildModels.push(...result.components);
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
      components: [],
    };
  }

  // additionalProperties: true の場合（any型、サポート外）
  if (additional === true) {
    return createAdditionalPropertiesTraversalError(
      "additionalProperties: true (any type) is not supported in object schemas",
      "ADDITIONAL_PROPERTIES_ANY_NOT_SUPPORTED",
      { documentPath: context.documentPath },
    );
  }

  // additionalProperties: false の場合
  if (additional === false) {
    return {
      type: undefined,
      components: [],
    };
  }

  // additionalProperties にスキーマが指定されている場合
  const name = getComponentName(context);
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
    return createAdditionalPropertiesTraversalError(
      `Failed to process additionalProperties in object: ${referencePath}`,
      "ADDITIONAL_PROPERTIES_RESOLUTION_FAILED",
      { documentPath: context.documentPath, referencePath },
    );
  }

  return {
    type: valueResult.type as AdditionalPropertiesTraversalResult["type"],
    components:
      valueResult.components as AdditionalPropertiesTraversalResult["components"],
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
          components: [],
        })
        .mockReturnValueOnce({
          type: "number",
          components: [],
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
        components: [],
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
        components: [],
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
        components: [],
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
          components: [],
        })
        .mockReturnValueOnce({
          type: null, // 失敗
          components: [],
        })
        .mockReturnValueOnce({
          type: "number",
          components: [],
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
      // プロパティのスキップ時は警告を出さない（エラーはvisitSchema内で既に報告済み）
      // expect(warnSpy).toHaveBeenCalledWith(
      //   expect.stringContaining("Failed to resolve property type"),
      // );

      warnSpy.mockRestore();
    });

    it("should collect child models from nested schemas", () => {
      const mockVisitSchema = vi
        .fn()
        .mockReturnValueOnce({
          type: {
            kind: "ref",
            referencePath: "#/components/schemas/AddressModel",
          },
          components: [
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
          components: [],
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

    it("should extract defaultValue from properties", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "integer",
        components: [],
      });

      const schema: SchemaObject = {
        type: "object",
        properties: {
          age: { type: "integer", default: 18 },
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "User"],
        rootSegment: "components",
      };

      const result = traverseObjectProperties(schema, context, mockVisitSchema);

      expect(result.properties[0]).toEqual({
        name: "age",
        type: "integer",
        defaultValue: 18,
      });
    });

    it("should extract deprecated flag from properties", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "string",
        components: [],
      });

      const schema: SchemaObject = {
        type: "object",
        properties: {
          oldField: { type: "string", deprecated: true },
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "User"],
        rootSegment: "components",
      };

      const result = traverseObjectProperties(schema, context, mockVisitSchema);

      expect(result.properties[0]).toEqual({
        name: "oldField",
        type: "string",
        deprecated: true,
      });
    });

    it("should extract readOnly flag from properties", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "string",
        components: [],
      });

      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "string", readOnly: true },
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "User"],
        rootSegment: "components",
      };

      const result = traverseObjectProperties(schema, context, mockVisitSchema);

      expect(result.properties[0]).toEqual({
        name: "id",
        type: "string",
        readOnly: true,
      });
    });

    it("should extract writeOnly flag from properties", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "string",
        components: [],
      });

      const schema: SchemaObject = {
        type: "object",
        properties: {
          password: { type: "string", writeOnly: true },
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "User"],
        rootSegment: "components",
      };

      const result = traverseObjectProperties(schema, context, mockVisitSchema);

      expect(result.properties[0]).toEqual({
        name: "password",
        type: "string",
        writeOnly: true,
      });
    });

    it("should extract validation constraints from properties", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "string",
        components: [],
      });

      const schema: SchemaObject = {
        type: "object",
        properties: {
          username: {
            type: "string",
            minLength: 3,
            maxLength: 20,
            pattern: "^[a-zA-Z0-9_]+$",
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "User"],
        rootSegment: "components",
      };

      const result = traverseObjectProperties(schema, context, mockVisitSchema);

      expect(result.properties[0]).toMatchObject({
        name: "username",
        type: "string",
        validation: {
          minLength: 3,
          maxLength: 20,
          pattern: "^[a-zA-Z0-9_]+$",
        },
      });
    });

    it("should extract x-extensions from properties", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "string",
        components: [],
      });

      const schema: SchemaObject = {
        type: "object",
        properties: {
          email: {
            type: "string",
            "x-validation-message": "Invalid email format",
            "x-custom-field": "custom-value",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "User"],
        rootSegment: "components",
      };

      const result = traverseObjectProperties(schema, context, mockVisitSchema);

      expect(result.properties[0]).toMatchObject({
        name: "email",
        type: "string",
        extensions: {
          "x-validation-message": "Invalid email format",
          "x-custom-field": "custom-value",
        },
      });
    });

    it("should extract all metadata together from properties", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "string",
        components: [],
      });

      const schema: SchemaObject = {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            description: "User status",
            default: "active",
            deprecated: true,
            minLength: 1,
            maxLength: 50,
            "x-deprecated-reason": "Use accountState instead",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "User"],
        rootSegment: "components",
      };

      const result = traverseObjectProperties(schema, context, mockVisitSchema);

      expect(result.properties[0]).toMatchObject({
        name: "status",
        type: "string",
        required: true,
        description: "User status",
        defaultValue: "active",
        deprecated: true,
        validation: {
          minLength: 1,
          maxLength: 50,
        },
        extensions: {
          "x-deprecated-reason": "Use accountState instead",
        },
      });
    });
  });

  describe("traverseObjectAdditionalProperties", () => {
    it("should traverse additionalProperties with schema", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "string",
        components: [],
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
      expect(result.components).toEqual([]);
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
      expect(result.components).toEqual([]);
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
      expect(result.components).toEqual([]);
      expect(mockVisitSchema).not.toHaveBeenCalled();
    });

    it("should warn when additionalProperties value type resolution fails", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: null,
        components: [],
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
      expect(result.components).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        "Failed to process additionalProperties in object: #/components/schemas/FailedExtra",
      );

      warnSpy.mockRestore();
    });
  });
}
