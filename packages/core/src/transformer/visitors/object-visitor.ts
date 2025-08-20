/**
 * @file Object型のSchemaObjectをIRModelに変換するVisitor
 *
 * このVisitorはObject型のスキーマ構造の処理に専念し、
 * 各プロパティの型判定は`visitSchema`に委譲します。
 * これにより単一責任原則を実現し、型判定のロジックの重複を防ぎます。
 *
 * @bnf <schema-object> - type: "object"を持つスキーマオブジェクト
 * @bnf-fields
 *   - `type`: "object"
 *   - `properties`: プロパティの定義マップ
 *   - `required`: 必須プロパティ名の配列
 *   - `description`: モデルの説明
 */

import { consola } from "consola";
import { pascalCase } from "es-toolkit/string";
import type {
  SchemaObject,
  SchemaObjectWithNullable,
} from "../../types/index.js";
import type { IREnum, IRModel, IRProperty } from "../../types/ir/data.js";
import { extractValidation } from "../helpers/extract-validation.js";
import { visitSchema } from "./schema-visitor.js";

/**
 * Object Visitorのコンテキスト
 */
export interface ObjectVisitorContext {
  /** モデル名（必須） */
  name: string;
}

/**
 * Object Visitorの結果
 */
export interface ObjectVisitorResult {
  /** すべてのモデル（メインモデル＋ネストしたモデル） */
  models: IRModel[];
  /** インラインenum */
  enums: IREnum[];
}

/**
 * Object型のSchemaObjectをIRModelに変換し、ネスト構造を抽出
 *
 * 責務:
 * - Object型スキーマの構造処理（propertiesの展開、requiredの適用）
 * - 各プロパティの型判定を`visitSchema`に委譲
 * - ネストされたモデルとenumの収集と集約
 *
 * OpenAPI 3.0.x におけるrequiredとnullableの組み合わせ：
 * - required: true  + nullable: true  = 必須だがnull値を許可
 * - required: true  + nullable: false = 必須で値が必要（デフォルト）
 * - required: false + nullable: true  = オプショナルでnull値も許可
 * - required: false + nullable: false = オプショナル（デフォルト）
 *
 * nullable情報はvisitSchema→visitType経由で各プロパティの型情報に含まれる
 *
 * @param schema - OpenAPI SchemaObject (type: "object")
 * @param context - Visitor context with model name
 * @returns ObjectVisitorResult型の結果（メインモデル、ネストしたモデル、インラインenum）
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
 * // result.models[0]: メインのUserモデル
 * // result.models[1..]: ネストしたモデル（visitSchema経由で抽出）
 * // result.enums: インラインenum（visitSchema経由で抽出）
 *
 * // 内部では各プロパティに対してvisitSchemaを呼び出し
 * // 型判定と処理を委譲している
 * ```
 */
export function visitObject(
  schema: SchemaObjectWithNullable,
  context: ObjectVisitorContext,
): ObjectVisitorResult {
  const result: ObjectVisitorResult = {
    models: [],
    enums: [],
  };

  const { name } = context;

  // 名前の妥当性チェック
  if (!name.trim()) {
    consola.warn("Invalid model name: empty or whitespace only");
    return result;
  }

  // object型でない場合
  if (schema.type !== "object") {
    consola.warn(`Invalid type for object visitor: ${schema.type}`);
    return result;
  }

  // propertiesがない場合
  if (!schema.properties) {
    consola.warn(`Object schema ${name} has no properties`);
    return result;
  }

  // requiredプロパティの配列を取得（未定義の場合は空配列）
  const required = schema.required || [];

  // 各プロパティをIRPropertyに変換
  const properties: IRProperty[] = [];

  // ネストしたモデルとenumを収集
  const nestedModels: IRModel[] = [];
  const nestedEnums: IREnum[] = [];

  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    const schemaObj = propSchema as SchemaObjectWithNullable;

    // プロパティ名を含む適切な名前を生成
    const propTypeName = `${name}${pascalCase(propName)}`;

    // visitSchemaを使って型を判定・処理
    const propResult = visitSchema(schemaObj, {
      name: propTypeName,
    });

    // 抽出されたモデルとenumを収集
    nestedModels.push(...propResult.models);
    nestedEnums.push(...propResult.enums);

    // プロパティの型が取得できた場合のみ追加
    if (propResult.type) {
      const property: IRProperty = {
        name: propName,
        type: propResult.type,
        required: required.includes(propName),
      };

      // descriptionがある場合は追加
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
    } else {
      // 型が無効な場合はスキップ
      consola.warn(`Skipping property ${propName} in ${name}: invalid type`);
    }
  }

  // プロパティが1つも変換できなかった場合
  if (properties.length === 0) {
    consola.warn(`No valid properties found for model ${name}`);
    return result;
  }

  const mainModel: IRModel = { name, properties };

  // descriptionがある場合のみ追加
  if (schema.description) {
    mainModel.description = schema.description;
  }

  // メインモデルを最初に、ネストしたモデルをその後に追加
  result.models.push(mainModel);
  result.models.push(...nestedModels);
  result.enums = nestedEnums;

  return result;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitObject", () => {
    // ===================================
    // カテゴリ1: 基本的なObject処理
    // ===================================
    it("should convert object schema to IRModel", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "string" },
        },
      };

      const result = visitObject(schema, { name: "Simple" });

      expect(result).toEqual({
        models: [
          {
            name: "Simple",
            properties: [
              {
                name: "id",
                type: { kind: "primitive", type: "string" },
                required: false,
              },
            ],
          },
        ],
        enums: [],
      });
    });

    it("should handle model with description", () => {
      const schema: SchemaObject = {
        type: "object",
        description: "Test model",
        properties: {
          id: { type: "integer" },
        },
      };

      const result = visitObject(schema, { name: "Model" });

      expect(result.models[0]).toEqual({
        name: "Model",
        description: "Test model",
        properties: [
          {
            name: "id",
            type: { kind: "primitive", type: "integer" },
            required: false,
          },
        ],
      });
    });

    // ===================================
    // カテゴリ2: プロパティのメタデータ処理
    // ===================================
    it("should handle properties with descriptions", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "User's full name",
          },
        },
      };

      const result = visitObject(schema, { name: "User" });

      expect(result.models[0]).toEqual({
        name: "User",
        properties: [
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
        },
      };

      const result = visitObject(schema, { name: "Config" });

      expect(result.models[0]).toEqual({
        name: "Config",
        properties: [
          {
            name: "status",
            type: { kind: "primitive", type: "string" },
            required: false,
            defaultValue: "active",
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
        },
      };

      const result = visitObject(schema, { name: "Model" });

      expect(result.models[0]).toEqual({
        name: "Model",
        properties: [
          {
            name: "oldField",
            type: { kind: "primitive", type: "string" },
            required: false,
            deprecated: true,
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
        },
      };

      const result = visitObject(schema, { name: "User" });

      expect(result).toEqual({
        models: [
          {
            name: "User",
            properties: [
              {
                name: "username",
                type: { kind: "primitive", type: "string" },
                required: false,
                validation: {
                  minLength: 3,
                  maxLength: 20,
                  pattern: "^[a-zA-Z0-9]+$",
                },
              },
            ],
          },
        ],
        enums: [],
      });
    });

    // ===================================
    // カテゴリ3: required/nullable処理
    // ===================================
    it("should handle combination of required and nullable properties", () => {
      const schema = {
        type: "object",
        properties: {
          requiredNullable: {
            type: "string",
            nullable: true,
          },
          requiredNotNullable: {
            type: "string",
          },
          optionalNullable: {
            type: "string",
            nullable: true,
          },
          optionalNotNullable: {
            type: "string",
          },
        },
        required: ["requiredNullable", "requiredNotNullable"],
      } as SchemaObjectWithNullable;

      const result = visitObject(schema, { name: "NullableTest" });

      expect(result.models[0]).toEqual({
        name: "NullableTest",
        properties: [
          {
            name: "requiredNullable",
            type: { kind: "primitive", type: "string", nullable: true },
            required: true,
          },
          {
            name: "requiredNotNullable",
            type: { kind: "primitive", type: "string" },
            required: true,
          },
          {
            name: "optionalNullable",
            type: { kind: "primitive", type: "string", nullable: true },
            required: false,
          },
          {
            name: "optionalNotNullable",
            type: { kind: "primitive", type: "string" },
            required: false,
          },
        ],
      });
    });

    it("should ignore non-existent property names in required array", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
        },
        required: ["id", "nonExistent"], // 存在しないプロパティ名を含む
      };

      const result = visitObject(schema, { name: "TestModel" });

      expect(result.models[0]).toEqual({
        name: "TestModel",
        properties: [
          {
            name: "id",
            type: { kind: "primitive", type: "integer" },
            required: true, // 存在するプロパティは正しくrequired
          },
          {
            name: "name",
            type: { kind: "primitive", type: "string" },
            required: false, // required配列に含まれていないのでfalse
          },
        ],
      });
    });

    // ===================================
    // カテゴリ4: visitSchemaへの委譲
    // ===================================
    it("should delegate nested objects to visitSchema", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          address: {
            type: "object",
            properties: {
              street: { type: "string" },
            },
          },
        },
      };

      const result = visitObject(schema, { name: "Person" });

      expect(result).toEqual({
        models: [
          {
            name: "Person",
            properties: [
              {
                name: "address",
                type: { kind: "ref", name: "PersonAddress" },
                required: false,
              },
            ],
          },
          {
            name: "PersonAddress",
            properties: [
              {
                name: "street",
                type: { kind: "primitive", type: "string" },
                required: false,
              },
            ],
          },
        ],
        enums: [],
      });
    });

    it("should handle array properties", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          tags: {
            type: "array",
            items: { type: "string" },
          },
        },
      };

      const result = visitObject(schema, { name: "Data" });

      expect(result).toEqual({
        models: [
          {
            name: "Data",
            properties: [
              {
                name: "tags",
                type: {
                  kind: "array",
                  itemType: { kind: "primitive", type: "string" },
                },
                required: false,
              },
            ],
          },
        ],
        enums: [],
      });
    });

    it("should handle $ref properties", () => {
      const schema = {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
        },
      } as SchemaObject;

      const result = visitObject(schema, { name: "Membership" });

      expect(result).toEqual({
        models: [
          {
            name: "Membership",
            properties: [
              {
                name: "user",
                type: { kind: "ref", name: "User" },
                required: false,
              },
            ],
          },
        ],
        enums: [],
      });
    });

    it("should collect enums from delegated properties", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["draft", "published", "archived"],
            description: "Document status",
          },
        },
      };

      const result = visitObject(schema, { name: "Document" });

      expect(result).toEqual({
        models: [
          {
            name: "Document",
            properties: [
              {
                name: "status",
                type: { kind: "ref", name: "DocumentStatus" },
                required: false,
                description: "Document status",
                validation: {
                  enum: ["draft", "published", "archived"],
                },
              },
            ],
          },
        ],
        enums: [
          {
            name: "DocumentStatus",
            description: "Document status",
            type: "string",
            values: [
              { value: "draft", name: "DRAFT" },
              { value: "published", name: "PUBLISHED" },
              { value: "archived", name: "ARCHIVED" },
            ],
          },
        ],
      });
    });

    // ===================================
    // カテゴリ5: エラーハンドリング
    // ===================================
    it("should return empty result for non-object type", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObject = {
        type: "string",
        properties: {
          // string型なのにpropertiesがある（無効）
          name: { type: "string" },
        },
      };

      const result = visitObject(schema, { name: "Invalid" });

      expect(result).toEqual({
        models: [],
        enums: [],
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid type for object visitor: string",
      );

      warnSpy.mockRestore();
    });

    it("should return empty result for object without properties", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObject = {
        type: "object",
        // propertiesが未定義
      };

      const result = visitObject(schema, { name: "Empty" });

      expect(result).toEqual({
        models: [],
        enums: [],
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "Object schema Empty has no properties",
      );

      warnSpy.mockRestore();
    });

    it("should return empty result for object with null properties", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema = {
        type: "object",
        properties: null,
      } as unknown as SchemaObject;

      const result = visitObject(schema, { name: "NullProps" });

      expect(result).toEqual({
        models: [],
        enums: [],
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "Object schema NullProps has no properties",
      );

      warnSpy.mockRestore();
    });

    it("should return empty result for object with empty properties", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObject = {
        type: "object",
        properties: {},
      };

      const result = visitObject(schema, { name: "EmptyProps" });

      expect(result).toEqual({
        models: [],
        enums: [],
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "No valid properties found for model EmptyProps",
      );

      warnSpy.mockRestore();
    });

    it("should return empty result for empty name", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "integer" },
        },
      };

      const result = visitObject(schema, { name: "" });

      expect(result).toEqual({
        models: [],
        enums: [],
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid model name: empty or whitespace only",
      );

      warnSpy.mockRestore();
    });

    it("should return empty result for whitespace-only name", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "integer" },
        },
      };

      const result = visitObject(schema, { name: "   " });

      expect(result).toEqual({
        models: [],
        enums: [],
      });
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
        },
      };

      const result = visitObject(schema, { name: "Mixed" });

      expect(result).toEqual({
        models: [
          {
            name: "Mixed",
            properties: [
              {
                name: "valid",
                type: { kind: "primitive", type: "string" },
                required: false,
              },
            ],
          },
        ],
        enums: [],
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "Skipping property invalid in Mixed: invalid type",
      );

      warnSpy.mockRestore();
    });

    it("should return empty result if all properties are invalid", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObject = {
        type: "object",
        properties: {
          invalid1: { type: "unknown" } as unknown as SchemaObject,
          invalid2: { type: "invalid" } as unknown as SchemaObject,
        },
      };

      const result = visitObject(schema, { name: "AllInvalid" });

      expect(result).toEqual({
        models: [],
        enums: [],
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "No valid properties found for model AllInvalid",
      );

      warnSpy.mockRestore();
    });
  });
}
