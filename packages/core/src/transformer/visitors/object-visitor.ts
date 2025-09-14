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
import type { SchemaObject, SchemaObjectWithNullable } from "../../types/index";
import type {
  IRModel,
  IRProperty,
  IRResponseModel,
  IRRequestBodyModel,
} from "../../types/ir/data";
import type { IRResponseHeader } from "../../types/ir/api";
import { buildReferencePath } from "../helpers/build-reference-path";
import { extractValidation } from "../helpers/extract-validation";
import type { VisitorContext } from "../types";
import { visitSchema } from "./schema-visitor";

/**
 * Object Visitorの結果
 */
export interface ObjectVisitorResult {
  /** すべてのモデル（メインモデル＋ネストしたモデル、enumを統一的に管理） */
  models: IRModel[];
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
 * const result = visitObject(schema, { name: "User"] });
 * // result.models[0]: メインのUserモデル
 * // result.models[1..]: ネストしたモデル（visitSchema経由で抽出）
 * // result.models: インラインモデル（オブジェクト、列挙型、配列、マップを統一、visitSchema経由で抽出）
 *
 * // 内部では各プロパティに対してvisitSchemaを呼び出し
 * // 型判定と処理を委譲している
 * ```
 */
export function visitObject(
  schema: SchemaObjectWithNullable,
  context: VisitorContext,
): ObjectVisitorResult {
  const result: ObjectVisitorResult = {
    models: [],
  };

  // documentPathから名前を抽出（最後の要素がモデル名）
  const name = context.documentPath[context.documentPath.length - 1] || "";

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

  // ネストしたモデルを収集
  const nestedModels: IRModel[] = [];

  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    const schemaObj = propSchema as SchemaObjectWithNullable;

    // プロパティ名を含む適切な名前を生成
    const propTypeName = `${name}${pascalCase(propName)}`;

    // visitSchemaを使って型を判定・処理
    // ネストされたモデルは独立したコンポーネントとして扱う
    // 親のコンテキストのパスを継承し、最後の要素を新しい名前に置き換える
    const propResult = visitSchema(schemaObj, {
      documentPath: [...context.documentPath.slice(0, -1), propTypeName],
      rootSegment: context.rootSegment,
    });

    // 抽出されたモデルを収集
    nestedModels.push(...propResult.models);

    // プロパティの型が取得できた場合のみ追加
    if (propResult.type) {
      const property: IRProperty = {
        name: propName,
        description: null, // TODO: implement property description handling
        type: propResult.type,
        required: required.includes(propName),
        nullable: null, // TODO: implement nullable handling
        defaultValue: null, // TODO: implement default value handling
        deprecated: null, // TODO: implement deprecated handling
        validation: null, // TODO: implement validation handling
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

      // nullableがある場合は追加
      if (schemaObj.nullable === true) {
        property.nullable = true;
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

  const mainModel: IRModel = {
    kind: "object",
    name,
    referencePath: buildReferencePath(context.documentPath),
    description: schema.description || null,
    properties,
  };

  // メインモデルを最初に、ネストしたモデルをその後に追加
  result.models.push(mainModel);
  result.models.push(...nestedModels);

  return result;
}

/**
 * レスポンス専用モデル作成結果
 */
export interface ResponseObjectVisitorResult {
  /** レスポンスモデル（メインモデル＋ネストしたモデル、enumを統一的に管理） */
  models: IRModel[];
}

/**
 * レスポンス用のObject型SchemaObjectをIRResponseModelに変換
 *
 * visitObjectの機能をベースにし、レスポンス固有のメタデータ（statusCode、headers）を追加
 *
 * @param schema - OpenAPI SchemaObject (type: "object")
 * @param context - Visitor context with model name
 * @param statusCode - HTTPステータスコード
 * @param headers - レスポンスヘッダー（オプション）
 * @returns ResponseObjectVisitorResult型の結果
 */
export function visitResponseObject(
  schema: SchemaObjectWithNullable,
  context: VisitorContext,
  statusCode: string,
  headers?: IRResponseHeader[],
): ResponseObjectVisitorResult {
  const result: ResponseObjectVisitorResult = {
    models: [],
  };

  // documentPathから名前を抽出（最後の要素がモデル名）
  const name = context.documentPath[context.documentPath.length - 1] || "";

  // 名前の妥当性チェック
  if (!name.trim()) {
    consola.warn("Invalid model name: empty or whitespace only");
    return result;
  }

  // object型でない場合
  if (schema.type !== "object") {
    consola.warn(`Invalid type for response object visitor: ${schema.type}`);
    return result;
  }

  // propertiesがない場合
  if (!schema.properties) {
    consola.warn(`Response object schema ${name} has no properties`);
    return result;
  }

  // requiredプロパティの配列を取得（未定義の場合は空配列）
  const required = schema.required || [];

  // 各プロパティをIRPropertyに変換（visitObjectと同じロジック）
  const properties: IRProperty[] = [];
  const nestedModels: IRModel[] = [];

  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    const schemaObj = propSchema as SchemaObjectWithNullable;

    // プロパティ名を含む適切な名前を生成
    const propTypeName = `${name}${pascalCase(propName)}`;

    // visitSchemaを使って型を判定・処理
    const propResult = visitSchema(schemaObj, {
      documentPath: [...context.documentPath.slice(0, -1), propTypeName],
      rootSegment: context.rootSegment,
    });

    // 抽出されたモデルを収集
    nestedModels.push(...propResult.models);

    // プロパティの型が取得できた場合のみ追加
    if (propResult.type) {
      const property: IRProperty = {
        name: propName,
        description: null, // TODO: implement property description handling
        type: propResult.type,
        required: required.includes(propName),
        nullable: null, // TODO: implement nullable handling
        defaultValue: null, // TODO: implement default value handling
        deprecated: null, // TODO: implement deprecated handling
        validation: null, // TODO: implement validation handling
      };

      // 追加プロパティの設定（visitObjectと同じロジック）
      if (schemaObj.description) {
        property.description = schemaObj.description;
      }
      if (schemaObj.default !== undefined) {
        property.defaultValue = schemaObj.default;
      }
      if (schemaObj.deprecated === true) {
        property.deprecated = true;
      }
      if (schemaObj.nullable === true) {
        property.nullable = true;
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
    consola.warn(`No valid properties found for response model ${name}`);
    return result;
  }

  const responseModel: IRResponseModel = {
    kind: "response",
    name,
    referencePath: buildReferencePath(context.documentPath),
    description: schema.description || null,
    properties,
    statusCode,
    headers: null, // TODO: Implement headers processing
  };

  // headersがある場合のみ追加
  if (headers && headers.length > 0) {
    responseModel.headers = headers;
  }

  // メインモデルを最初に、ネストしたモデルをその後に追加
  result.models.push(responseModel);
  result.models.push(...nestedModels);

  return result;
}

/**
 * リクエストボディ専用モデル作成結果
 */
export interface RequestBodyObjectVisitorResult {
  /** リクエストボディモデル（メインモデル＋ネストしたモデル、enumを統一的に管理） */
  models: IRModel[];
}

/**
 * リクエストボディ用のObject型SchemaObjectをIRRequestBodyModelに変換
 *
 * visitObjectの機能をベースにし、リクエストボディ固有のメタデータ（required）を追加
 *
 * @param schema - OpenAPI SchemaObject (type: "object")
 * @param context - Visitor context with model name
 * @param required - リクエストボディの必須フラグ
 * @returns RequestBodyObjectVisitorResult型の結果
 */
export function visitRequestBodyObject(
  schema: SchemaObjectWithNullable,
  context: VisitorContext,
  required: boolean = false,
): RequestBodyObjectVisitorResult {
  const result: RequestBodyObjectVisitorResult = {
    models: [],
  };

  // documentPathから名前を抽出（最後の要素がモデル名）
  const name = context.documentPath[context.documentPath.length - 1] || "";

  // 名前の妥当性チェック
  if (!name.trim()) {
    consola.warn("Invalid model name: empty or whitespace only");
    return result;
  }

  // object型でない場合
  if (schema.type !== "object") {
    consola.warn(
      `Invalid type for request body object visitor: ${schema.type}`,
    );
    return result;
  }

  // propertiesがない場合
  if (!schema.properties) {
    consola.warn(`Request body object schema ${name} has no properties`);
    return result;
  }

  // requiredプロパティの配列を取得（未定義の場合は空配列）
  const requiredProps = schema.required || [];

  // 各プロパティをIRPropertyに変換（visitObjectと同じロジック）
  const properties: IRProperty[] = [];
  const nestedModels: IRModel[] = [];

  for (const [propName, propSchema] of Object.entries(schema.properties)) {
    const schemaObj = propSchema as SchemaObjectWithNullable;

    // プロパティ名を含む適切な名前を生成
    const propTypeName = `${name}${pascalCase(propName)}`;

    // visitSchemaを使って型を判定・処理
    const propResult = visitSchema(schemaObj, {
      documentPath: [...context.documentPath.slice(0, -1), propTypeName],
      rootSegment: context.rootSegment,
    });

    // 抽出されたモデルを収集
    nestedModels.push(...propResult.models);

    // プロパティの型が取得できた場合のみ追加
    if (propResult.type) {
      const property: IRProperty = {
        name: propName,
        description: null, // TODO: implement property description handling
        type: propResult.type,
        required: requiredProps.includes(propName),
        nullable: null, // TODO: implement nullable handling
        defaultValue: null, // TODO: implement default value handling
        deprecated: null, // TODO: implement deprecated handling
        validation: null, // TODO: implement validation handling
      };

      // 追加プロパティの設定（visitObjectと同じロジック）
      if (schemaObj.description) {
        property.description = schemaObj.description;
      }
      if (schemaObj.default !== undefined) {
        property.defaultValue = schemaObj.default;
      }
      if (schemaObj.deprecated === true) {
        property.deprecated = true;
      }
      if (schemaObj.nullable === true) {
        property.nullable = true;
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
    consola.warn(`No valid properties found for request body model ${name}`);
    return result;
  }

  const requestBodyModel: IRRequestBodyModel = {
    kind: "requestBody",
    name,
    referencePath: buildReferencePath(context.documentPath),
    properties,
    required,
    description: schema.description || null,
  };

  // メインモデルを最初に、ネストしたモデルをその後に追加
  result.models.push(requestBodyModel);
  result.models.push(...nestedModels);

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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "Simple"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [
          {
            kind: "object",
            name: "Simple",
            referencePath: "#/components/schemas/Simple",
            description: null,
            properties: [
              {
                name: "id",
                description: null,
                type: "string",
                required: false,
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
            ],
          },
        ],
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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "Model"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [
          {
            kind: "object",
            name: "Model",
            referencePath: "#/components/schemas/Model",
            description: "Test model",
            properties: [
              {
                name: "id",
                description: null,
                type: "int",
                required: false,
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
            ],
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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "User"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [
          {
            kind: "object",
            name: "User",
            referencePath: "#/components/schemas/User",
            description: null,
            properties: [
              {
                name: "name",
                description: "User's full name",
                type: "string",
                required: false,
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
            ],
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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "Config"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [
          {
            kind: "object",
            name: "Config",
            referencePath: "#/components/schemas/Config",
            description: null,
            properties: [
              {
                name: "status",
                description: null,
                type: "string",
                required: false,
                nullable: null,
                defaultValue: "active",
                deprecated: null,
                validation: null,
              },
            ],
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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "Model"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [
          {
            kind: "object",
            name: "Model",
            referencePath: "#/components/schemas/Model",
            description: null,
            properties: [
              {
                name: "oldField",
                description: null,
                type: "string",
                required: false,
                nullable: null,
                defaultValue: null,
                deprecated: true,
                validation: null,
              },
            ],
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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "User"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [
          {
            kind: "object",
            name: "User",
            referencePath: "#/components/schemas/User",
            description: null,
            properties: [
              {
                name: "username",
                description: null,
                type: "string",
                required: false,
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: {
                  minimum: null,
                  maximum: null,
                  exclusiveMinimum: null,
                  exclusiveMaximum: null,
                  minLength: 3,
                  maxLength: 20,
                  pattern: "^[a-zA-Z0-9]+$",
                  minItems: null,
                  maxItems: null,
                  uniqueItems: null,
                  minProperties: null,
                  maxProperties: null,
                  format: null,
                },
              },
            ],
          },
        ],
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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "NullableTest"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [
          {
            kind: "object",
            name: "NullableTest",
            referencePath: "#/components/schemas/NullableTest",
            description: null,
            properties: [
              {
                name: "requiredNullable",
                description: null,
                type: "string",
                required: true,
                nullable: true,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
              {
                name: "requiredNotNullable",
                description: null,
                type: "string",
                required: true,
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
              {
                name: "optionalNullable",
                description: null,
                type: "string",
                required: false,
                nullable: true,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
              {
                name: "optionalNotNullable",
                description: null,
                type: "string",
                required: false,
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
            ],
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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "TestModel"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [
          {
            kind: "object",
            name: "TestModel",
            referencePath: "#/components/schemas/TestModel",
            description: null,
            properties: [
              {
                name: "id",
                description: null,
                type: "int",
                required: true, // 存在するプロパティは正しくrequired
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
              {
                name: "name",
                description: null,
                type: "string",
                required: false, // required配列に含まれていないのでfalse
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
            ],
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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "Person"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [
          {
            kind: "object",
            name: "Person",
            referencePath: "#/components/schemas/Person",
            description: null,
            properties: [
              {
                name: "address",
                description: null,
                type: {
                  kind: "ref",
                  name: "#/components/schemas/PersonAddress",
                },
                required: false,
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
            ],
          },
          {
            kind: "object",
            name: "PersonAddress",
            referencePath: "#/components/schemas/PersonAddress",
            description: null,
            properties: [
              {
                name: "street",
                description: null,
                type: "string",
                required: false,
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
            ],
          },
        ],
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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "Data"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [
          {
            kind: "object",
            name: "Data",
            referencePath: "#/components/schemas/Data",
            description: null,
            properties: [
              {
                name: "tags",
                description: null,
                type: {
                  kind: "array",
                  itemType: "string",
                },
                required: false,
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
            ],
          },
        ],
      });
    });

    it("should handle $ref properties", () => {
      const schema = {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
        },
      } as SchemaObject;

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "Membership"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [
          {
            kind: "object",
            name: "Membership",
            referencePath: "#/components/schemas/Membership",
            description: null,
            properties: [
              {
                name: "user",
                description: null,
                type: { kind: "ref", name: "#/components/schemas/User" },
                required: false,
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
            ],
          },
        ],
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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "Document"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [
          {
            kind: "object",
            name: "Document",
            referencePath: "#/components/schemas/Document",
            description: null,
            properties: [
              {
                name: "status",
                description: "Document status",
                type: {
                  kind: "ref",
                  name: "#/components/schemas/DocumentStatus",
                },
                required: false,
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
            ],
          },
          {
            kind: "enum",
            name: "DocumentStatus",
            referencePath: "#/components/schemas/DocumentStatus",
            description: "Document status",
            type: "string",
            values: [
              { value: "draft", name: "DRAFT", description: null },
              { value: "published", name: "PUBLISHED", description: null },
              { value: "archived", name: "ARCHIVED", description: null },
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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "Invalid"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [],
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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "Empty"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [],
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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "NullProps"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [],
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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "EmptyProps"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [],
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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", ""],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [],
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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "   "],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [],
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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "Mixed"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [
          {
            kind: "object",
            name: "Mixed",
            referencePath: "#/components/schemas/Mixed",
            description: null,
            properties: [
              {
                name: "valid",
                description: null,
                type: "string",
                required: false,
                nullable: null,
                defaultValue: null,
                deprecated: null,
                validation: null,
              },
            ],
          },
        ],
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

      const result = visitObject(schema, {
        documentPath: ["components", "schemas", "AllInvalid"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [],
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "No valid properties found for model AllInvalid",
      );

      warnSpy.mockRestore();
    });
  });
}
