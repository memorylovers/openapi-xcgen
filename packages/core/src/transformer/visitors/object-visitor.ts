/**
 * @file Object型のSchemaObjectをIRModelに変換するVisitor
 * @bnf <schema-object> - type: "object"を持つスキーマオブジェクト
 * @bnf-fields
 *   - `type` (line 309): "object"
 *   - `properties` (line 321): プロパティの定義マップ
 *   - `required` (line 322): 必須プロパティ名の配列
 *   - `description` (line 335): モデルの説明
 */

import { consola } from "consola";
import type {
  SchemaObject,
  SchemaObjectWithNullable,
} from "../../types/index.js";
import type { IRModel, IRProperty } from "../../types/ir/data.js";
import { extractValidation } from "../helpers/extract-validation.js";
import { visitType } from "./type-visitor.js";

/**
 * Object Visitorのコンテキスト
 */
export interface ObjectVisitorContext {
  /** モデル名（必須） */
  name: string;
}

/**
 * object型のSchemaObjectをIRModelに変換
 *
 * OpenAPI 3.0.x におけるrequiredとnullableの組み合わせ：
 * - required: true  + nullable: true  = 必須だがnull値を許可
 * - required: true  + nullable: false = 必須で値が必要（デフォルト）
 * - required: false + nullable: true  = オプショナルでnull値も許可
 * - required: false + nullable: false = オプショナル（デフォルト）
 *
 * nullable情報はvisitType経由で各プロパティの型情報（IRPrimitive等）に含まれる
 *
 * @param schema - OpenAPI SchemaObject (type: "object")
 * @param context - Visitor context with model name
 * @returns IRModel型の結果、無効な場合はnull
 *
 * @example OpenAPI YAML
 * ```yaml
 * User:
 *   type: object
 *   description: "ユーザーモデル"
 *   properties:
 *     id:
 *       type: integer
 *       format: int64
 *     name:
 *       type: string
 *     email:
 *       type: string
 *       format: email
 *   required:
 *     - id
 *     - name
 * ```
 *
 * @example Usage
 * ```typescript
 * const result = visitObject(schema, { name: "User" });
 * ```
 */
export function visitObject(
  schema: SchemaObjectWithNullable,
  { name }: ObjectVisitorContext,
): IRModel | null {
  // 名前の妥当性チェック
  if (!name.trim()) {
    consola.warn("Invalid model name: empty or whitespace only");
    return null;
  }

  // object型でない場合
  if (schema.type !== "object") {
    consola.warn(`Invalid type for object visitor: ${schema.type}`);
    return null;
  }

  // propertiesがない場合
  if (!schema.properties) {
    consola.warn(`Object schema ${name} has no properties`);
    return null;
  }

  // requiredプロパティの配列を取得（未定義の場合は空配列）
  const required = schema.required || [];

  // 各プロパティをIRPropertyに変換
  const properties: IRProperty[] = [];
  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    const propType = visitType(propSchema as SchemaObjectWithNullable);

    // プロパティの型が無効な場合はスキップ
    if (propType === null) {
      consola.warn(`Skipping property ${propName} in ${name}: invalid type`);
      continue;
    }

    const property: IRProperty = {
      name: propName,
      type: propType,
      required: required.includes(propName),
    };

    // descriptionがある場合は追加
    const schemaObj = propSchema as SchemaObjectWithNullable;
    if (schemaObj.description) {
      property.description = schemaObj.description;
    }

    // defaultValueがある場合は追加
    if (schemaObj.default !== undefined) {
      property.defaultValue = schemaObj.default;
    }

    // deprecatedがある場合は追加
    if (schemaObj.deprecated === true) {
      property.deprecated = true;
    }

    // バリデーション情報を抽出
    const validation = extractValidation(schemaObj);
    if (validation) {
      property.validation = validation;
    }

    properties.push(property);
  }

  // プロパティが1つも変換できなかった場合
  if (properties.length === 0) {
    consola.warn(`No valid properties found for model ${name}`);
    return null;
  }

  const result: IRModel = { name, properties };

  // descriptionがある場合のみ追加
  if (schema.description) {
    result.description = schema.description;
  }

  return result;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitObject", () => {
    it("should convert object schema to IRModel", () => {
      const schema: SchemaObject = {
        type: "object",
        description: "User model",
        properties: {
          id: { type: "integer", format: "int64" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
        },
        required: ["id", "name"],
      };

      const result = visitObject(schema, { name: "User" });

      expect(result).toEqual({
        name: "User",
        description: "User model",
        properties: [
          {
            name: "id",
            type: { kind: "primitive", type: "integer", format: "int64" },
            required: true,
          },
          {
            name: "name",
            type: { kind: "primitive", type: "string" },
            required: true,
          },
          {
            name: "email",
            type: { kind: "primitive", type: "string", format: "email" },
            required: false,
          },
        ],
      });
    });

    it("should handle properties with descriptions", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: {
            type: "integer",
            description: "Unique identifier",
          },
          name: {
            type: "string",
            description: "User's full name",
          },
        },
        required: ["id"],
      };

      const result = visitObject(schema, { name: "User" });

      expect(result).toEqual({
        name: "User",
        properties: [
          {
            name: "id",
            type: { kind: "primitive", type: "integer" },
            required: true,
            description: "Unique identifier",
          },
          {
            name: "name",
            type: { kind: "primitive", type: "string" },
            required: false,
            description: "User's full name",
          },
        ],
      });
    });

    it("should handle properties with default values", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          status: {
            type: "string",
            default: "active",
          },
          count: {
            type: "integer",
            default: 0,
          },
        },
      };

      const result = visitObject(schema, { name: "Config" });

      expect(result).toEqual({
        name: "Config",
        properties: [
          {
            name: "status",
            type: { kind: "primitive", type: "string" },
            required: false,
            defaultValue: "active",
          },
          {
            name: "count",
            type: { kind: "primitive", type: "integer" },
            required: false,
            defaultValue: 0,
          },
        ],
      });
    });

    it("should handle deprecated properties", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          oldField: {
            type: "string",
            deprecated: true,
          },
          newField: {
            type: "string",
          },
        },
      };

      const result = visitObject(schema, { name: "Model" });

      expect(result).toEqual({
        name: "Model",
        properties: [
          {
            name: "oldField",
            type: { kind: "primitive", type: "string" },
            required: false,
            deprecated: true,
          },
          {
            name: "newField",
            type: { kind: "primitive", type: "string" },
            required: false,
          },
        ],
      });
    });

    it("should handle properties with validation", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          username: {
            type: "string",
            minLength: 3,
            maxLength: 20,
            pattern: "^[a-zA-Z0-9]+$",
          },
          age: {
            type: "integer",
            minimum: 0,
            maximum: 150,
          },
        },
      };

      const result = visitObject(schema, { name: "User" });

      expect(result?.properties[0].validation).toEqual({
        minLength: 3,
        maxLength: 20,
        pattern: "^[a-zA-Z0-9]+$",
      });
      expect(result?.properties[1].validation).toEqual({
        minimum: 0,
        maximum: 150,
      });
    });

    it("should handle nested object properties", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          address: {
            type: "object",
            properties: {
              street: { type: "string" },
              city: { type: "string" },
            },
          },
        },
      };

      const result = visitObject(schema, { name: "Person" });

      // type-visitorは現在object型をサポートしていないため、nullが返される
      // そのため、プロパティはスキップされる
      expect(result).toBe(null);
    });

    it("should handle array properties", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          tags: {
            type: "array",
            items: { type: "string" },
          },
          scores: {
            type: "array",
            items: { type: "number" },
          },
        },
      };

      const result = visitObject(schema, { name: "Data" });

      expect(result?.properties[0].type).toEqual({
        kind: "array",
        itemType: { kind: "primitive", type: "string" },
      });
      expect(result?.properties[1].type).toEqual({
        kind: "array",
        itemType: { kind: "primitive", type: "number" },
      });
    });

    it("should handle $ref properties", () => {
      const schema = {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
          group: { $ref: "#/components/schemas/Group" },
        },
        required: ["user"],
      } as SchemaObject;

      const result = visitObject(schema, { name: "Membership" });

      expect(result?.properties[0]).toEqual({
        name: "user",
        type: { kind: "ref", name: "User" },
        required: true,
      });
      expect(result?.properties[1]).toEqual({
        name: "group",
        type: { kind: "ref", name: "Group" },
        required: false,
      });
    });

    it("should handle combination of required and nullable properties", () => {
      const schema = {
        type: "object",
        properties: {
          requiredNullable: {
            type: "string",
            nullable: true,
            description: "Required but nullable",
          },
          requiredNotNullable: {
            type: "string",
            description: "Required and not nullable",
          },
          optionalNullable: {
            type: "string",
            nullable: true,
            description: "Optional and nullable",
          },
          optionalNotNullable: {
            type: "string",
            description: "Optional and not nullable",
          },
        },
        required: ["requiredNullable", "requiredNotNullable"],
      } as SchemaObjectWithNullable;

      const result = visitObject(schema, { name: "NullableTest" });

      expect(result).toEqual({
        name: "NullableTest",
        properties: [
          {
            name: "requiredNullable",
            type: { kind: "primitive", type: "string", nullable: true },
            required: true,
            description: "Required but nullable",
          },
          {
            name: "requiredNotNullable",
            type: { kind: "primitive", type: "string" },
            required: true,
            description: "Required and not nullable",
          },
          {
            name: "optionalNullable",
            type: { kind: "primitive", type: "string", nullable: true },
            required: false,
            description: "Optional and nullable",
          },
          {
            name: "optionalNotNullable",
            type: { kind: "primitive", type: "string" },
            required: false,
            description: "Optional and not nullable",
          },
        ],
      });
    });

    it("should return null for non-object type", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObject = {
        type: "string",
        properties: {
          // string型なのにpropertiesがある（無効）
          name: { type: "string" },
        },
      };

      const result = visitObject(schema, { name: "Invalid" });

      expect(result).toBe(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid type for object visitor: string",
      );

      warnSpy.mockRestore();
    });

    it("should return null for object without properties", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObject = {
        type: "object",
        // propertiesが未定義
      };

      const result = visitObject(schema, { name: "Empty" });

      expect(result).toBe(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "Object schema Empty has no properties",
      );

      warnSpy.mockRestore();
    });

    it("should return null for empty name", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "integer" },
        },
      };

      const result = visitObject(schema, { name: "" });

      expect(result).toBe(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid model name: empty or whitespace only",
      );

      warnSpy.mockRestore();
    });

    it("should return null for whitespace-only name", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "integer" },
        },
      };

      const result = visitObject(schema, { name: "   " });

      expect(result).toBe(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid model name: empty or whitespace only",
      );

      warnSpy.mockRestore();
    });

    it("should skip invalid properties and warn", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObject = {
        type: "object",
        properties: {
          valid: { type: "string" },
          invalid: { type: "unknown" } as unknown as SchemaObject,
          alsoValid: { type: "integer" },
        },
      };

      const result = visitObject(schema, { name: "Mixed" });

      expect(result?.properties).toHaveLength(2);
      expect(result?.properties[0].name).toBe("valid");
      expect(result?.properties[1].name).toBe("alsoValid");
      expect(warnSpy).toHaveBeenCalledWith(
        "Skipping property invalid in Mixed: invalid type",
      );

      warnSpy.mockRestore();
    });

    it("should return null if all properties are invalid", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObject = {
        type: "object",
        properties: {
          invalid1: { type: "unknown" } as unknown as SchemaObject,
          invalid2: { type: "object" }, // object型は未サポート
        },
      };

      const result = visitObject(schema, { name: "AllInvalid" });

      expect(result).toBe(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "No valid properties found for model AllInvalid",
      );

      warnSpy.mockRestore();
    });

    it("should handle model without description", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "integer" },
        },
      };

      const result = visitObject(schema, { name: "Simple" });

      expect(result).toEqual({
        name: "Simple",
        properties: [
          {
            name: "id",
            type: { kind: "primitive", type: "integer" },
            required: false,
          },
        ],
      });
    });

    it("should handle all fields combined", () => {
      const schema: SchemaObject = {
        type: "object",
        description: "Complex model with all features",
        properties: {
          id: {
            type: "integer",
            format: "int64",
            description: "Unique ID",
          },
          name: {
            type: "string",
            minLength: 1,
            maxLength: 100,
            description: "Name field",
          },
          status: {
            type: "string",
            enum: ["active", "inactive"],
            default: "active",
            description: "Status field",
          },
          oldField: {
            type: "string",
            deprecated: true,
            description: "Deprecated field",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            minItems: 0,
            maxItems: 10,
          },
        },
        required: ["id", "name"],
      };

      const result = visitObject(schema, { name: "ComplexModel" });

      expect(result).toEqual({
        name: "ComplexModel",
        description: "Complex model with all features",
        properties: [
          {
            name: "id",
            type: { kind: "primitive", type: "integer", format: "int64" },
            required: true,
            description: "Unique ID",
          },
          {
            name: "name",
            type: { kind: "primitive", type: "string" },
            required: true,
            description: "Name field",
            validation: {
              minLength: 1,
              maxLength: 100,
            },
          },
          {
            name: "status",
            type: { kind: "primitive", type: "string" },
            required: false,
            description: "Status field",
            defaultValue: "active",
            validation: {
              enum: ["active", "inactive"],
            },
          },
          {
            name: "oldField",
            type: { kind: "primitive", type: "string" },
            required: false,
            description: "Deprecated field",
            deprecated: true,
          },
          {
            name: "tags",
            type: {
              kind: "array",
              itemType: { kind: "primitive", type: "string" },
            },
            required: false,
            validation: {
              minItems: 0,
              maxItems: 10,
            },
          },
        ],
      });
    });
  });
}
