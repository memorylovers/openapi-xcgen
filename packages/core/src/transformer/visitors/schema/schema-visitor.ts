/**
 * Schema visitor - 中央型判定と処理の振り分け
 *
 * OpenAPIのSchemaObjectの型を判定し、適切な専門Visitorに処理を委譲する
 * 中央ディスパッチャーの役割を持ちます。
 *
 * 責務:
 * - スキーマの型判定（enum、object、その他）
 * - 適切な専門Visitorへの処理委譲
 * - ネストしたオブジェクトやインラインenumの独立した型としての抽出
 *
 * この設計により、型判定ロジックが単一の場所に集約され、
 * 他のVisitorは各自の専門処理に専念できます。
 */

import { consola } from "consola";
import type {
  IRModel,
  IRType,
  ReferenceObject,
  SchemaObjectWithNullable,
} from "../../../types";
import { isReferenceObject } from "../../../types";
import { buildReferencePath } from "../../helpers";
import type { VisitorContext } from "../../types";
import { visitAllOf } from "./allof-visitor";
import { visitArray } from "./array-visitor";
import { visitEnum } from "./enum-visitor";
import { visitMap } from "./map-visitor";
import { visitObject } from "./object-visitor";
import { visitType } from "./type-visitor";

/**
 * Schema Visitorの結果
 */
export interface SchemaVisitorResult {
  /** 主要な型 */
  type: IRType | null;
  /** 抽出されたモデル（オブジェクト、列挙型、配列、マップを統一的に管理） */
  models: IRModel[];
}

/**
 * SchemaObjectの型を判定し、適切なVisitorに処理を委譲
 *
 * 処理フロー:
 * 1. スキーマにenumフィールドがある場合 → visitEnumで処理
 * 2. type: "object"の場合 → visitObjectで処理（再帰的にvisitSchemaを呼ぶ）
 * 3. その他の型の場合 → visitTypeで処理（primitive、array、$refなど）
 *
 * @param schema - 処理対象のスキーマ
 * @param context - Visitorコンテキスト（documentPathから名前を抽出）
 * @returns 処理結果（型と抽出されたmodels/enums）
 *
 * @example
 * ```typescript
 * // Enum型の場合
 * const enumSchema = { type: "string", enum: ["A", "B"] };
 * const result = visitSchema(enumSchema, { documentPath: ["components", "schemas", "Status"] });
 * // → enumsに追加、typeはref型
 *
 * // Object型の場合
 * const objectSchema = { type: "object", properties: {...} };
 * const result = visitSchema(objectSchema, { documentPath: ["components", "schemas", "User"] });
 * // → modelsに追加、各プロパティは再帰的に処理
 *
 * // Primitive型の場合
 * const primitiveSchema = { type: "string" };
 * const result = visitSchema(primitiveSchema, { documentPath: ["components", "schemas", "Name"] });
 * // → typeはprimitive型
 * ```
 */
export function visitSchema(
  schema: SchemaObjectWithNullable | ReferenceObject,
  context: VisitorContext,
): SchemaVisitorResult {
  const result: SchemaVisitorResult = {
    type: null,
    models: [],
  };

  if (isReferenceObject(schema)) {
    result.type = {
      kind: "ref",
      name: schema.$ref,
    };
    return result;
  }

  // 未対応機能の検出と警告
  if ("allOf" in schema && schema.allOf) {
    const allOfResult = visitAllOf(schema, context);
    result.models.push(...allOfResult.models);
    result.type = allOfResult.type;
    return result;
  }
  if ("oneOf" in schema && schema.oneOf) {
    consola.warn(
      `oneOf is not supported yet: ${buildReferencePath(context.documentPath)}`,
    );
    return result;
  }
  if ("anyOf" in schema && schema.anyOf) {
    consola.warn(
      `anyOf is not supported yet: ${buildReferencePath(context.documentPath)}`,
    );
    return result;
  }
  if ("discriminator" in schema && schema.discriminator) {
    consola.warn(
      `discriminator is not supported yet: ${buildReferencePath(context.documentPath)}`,
    );
    return result;
  }
  if ("not" in schema && schema.not) {
    consola.warn(
      `not schema is not supported yet: ${buildReferencePath(context.documentPath)}`,
    );
    return result;
  }

  // additionalPropertiesのみの場合の検出（プロパティがない場合）
  if (
    "additionalProperties" in schema &&
    schema.additionalProperties !== undefined &&
    (!schema.properties || Object.keys(schema.properties).length === 0)
  ) {
    const mapResult = visitMap(schema, context);
    result.models.push(...mapResult.models);
    result.type = mapResult.type;
    return result;
  }

  // enum型の処理
  if (schema.enum !== undefined) {
    const enumResult = visitEnum(schema, context);
    if (enumResult.models.length === 0) return result;

    result.models.push(...enumResult.models);
    result.type = {
      kind: "ref",
      name: buildReferencePath(context.documentPath),
    };
    return result;
  }

  // object型の処理（明示的または暗黙的）
  // OpenAPI 3.1では、typeがなくてもpropertiesがあれば暗黙的にobject型
  if (schema.type === "object" || (!schema.type && schema.properties)) {
    // visitObjectでobject処理（ネスト構造の抽出含む）を完結
    // additionalPropertiesも含めて処理する
    const objectResult = visitObject(schema, context);

    // visitObjectの結果をマージ
    result.models.push(...objectResult.models);

    // メインモデルが作成された場合は参照型を設定
    if (objectResult.models.length > 0) {
      result.type = {
        kind: "ref",
        name: buildReferencePath(context.documentPath),
      };
    }
    return result;
  }

  if (schema.type === "array") {
    const arrayResult = visitArray(schema, context);
    result.models.push(...arrayResult.models);
    result.type = arrayResult.type;
    return result;
  }

  // その他の型（プリミティブなど）
  result.type = visitType(schema, context);
  return result;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitSchema", () => {
    // ===================================
    // カテゴリ1: 基本的な型判定と委譲
    // ===================================
    /**
     * 仕様確認:
     * - OpenAPIのenumフィールドを持つスキーマは、独立したEnum型として抽出される
     * - 抽出されたEnum型への参照（ref）が返される
     * - enum値は指定された名前でenumsコレクションに追加される
     */
    it("should detect and process enum schema", () => {
      const schema: SchemaObjectWithNullable = {
        type: "string",
        enum: ["a", "b"],
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Status"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: { kind: "ref", name: "#/components/schemas/Status" },
        models: [
          {
            kind: "enum",
            name: "Status",
            referencePath: "#/components/schemas/Status",
            type: "string",
            values: [
              { value: "a", name: "A" },
              { value: "b", name: "B" },
            ],
          },
        ],
      });
    });

    /**
     * 仕様確認:
     * - type: "object"のスキーマは、独立したモデルとして抽出される
     * - モデルは指定された名前でmodelsコレクションに追加される
     * - モデルへの参照（ref）が返される
     */
    it("should delegate object schema to visitObject", () => {
      const schema: SchemaObjectWithNullable = {
        type: "object",
        properties: {
          id: { type: "string" },
        },
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "User"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: { kind: "ref", name: "#/components/schemas/User" },
        models: [
          {
            kind: "object",
            name: "User",
            referencePath: "#/components/schemas/User",
            properties: [
              {
                name: "id",
                type: "string",
              },
            ],
          },
        ],
      });
    });

    /**
     * 仕様確認:
     * - enumフィールドがなく、typeが"object"でもないスキーマは、その型に応じた処理が行われる
     * - プリミティブ型の場合は、そのままIRプリミティブ型として返される
     * - 抽出されるモデルやenumはない
     */
    it("should delegate other types to visitType", () => {
      const schema: SchemaObjectWithNullable = {
        type: "string",
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Name"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: "string",
        models: [],
      });
    });

    /**
     * 仕様確認:
     * - OpenAPIの$refフィールドは、参照先のコンポーネント名を抽出してref型として返される
     * - "#/components/schemas/XXX"形式から"XXX"が正しく抽出される
     * - コンテキスト名ではなく、$refの参照先名が使用される
     */
    it("should handle $ref at top level", () => {
      const schema = {
        $ref: "#/components/schemas/Foo",
      } as unknown as SchemaObjectWithNullable;
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Bar"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: { kind: "ref", name: "#/components/schemas/Foo" },
        models: [],
      });
    });

    // ===================================
    // カテゴリ2: 処理の優先順位と特殊ケース
    // ===================================
    /**
     * 仕様確認:
     * - enumフィールドが存在する場合、typeフィールドに関わらずenum処理が優先される
     * - これはOpenAPI仕様の処理フローに従った動作
     */
    it("should prioritize enum field over type field", () => {
      const schema: SchemaObjectWithNullable = {
        type: "number", // enumがあるので無視される
        enum: ["a", "b"], // 文字列のenum
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Status"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      // typeフィールドがnumberでもenumフィールドが優先される
      // enum-visitorはtypeフィールドをそのまま使用する
      expect(result).toEqual({
        type: { kind: "ref", name: "#/components/schemas/Status" },
        models: [
          {
            kind: "enum",
            name: "Status",
            referencePath: "#/components/schemas/Status",
            type: "double", // typeフィールドの値
            values: [
              { value: "a", name: "A" },
              { value: "b", name: "B" },
            ],
          },
        ],
      });
    });

    /**
     * 仕様確認:
     * - OpenAPIのenumは数値もサポートし、integer/number型のenumとして抽出される
     * - 数値enumも文字列enumと同様に、独立した型としてenumsコレクションに追加される
     * - 数値用の命名規則が適用される
     */
    it("should process numeric enum schema", () => {
      const schema: SchemaObjectWithNullable = {
        type: "integer",
        enum: [1, 2],
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Priority"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: { kind: "ref", name: "#/components/schemas/Priority" },
        models: [
          {
            kind: "enum",
            name: "Priority",
            referencePath: "#/components/schemas/Priority",
            type: "int",
            values: [
              { value: 1, name: "VALUE_1" },
              { value: 2, name: "VALUE_2" },
            ],
          },
        ],
      });
    });

    /**
     * 仕様確認:
     * - 配列要素がobject型の場合、そのobjectは独立したモデルとして抽出される
     * - これは"ネストしたオブジェクトの独立した型としての抽出"という仕様の一部
     * - 配列型は抽出されたモデルへの参照を持つ
     */
    it("should extract nested object in array as independent model", () => {
      const schema: SchemaObjectWithNullable = {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Item"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/Item",
        },
        models: [
          {
            kind: "array",
            name: "Item",
            referencePath: "#/components/schemas/Item",
            itemType: { kind: "ref", name: "#/components/schemas/ItemItem" },
          },
          {
            kind: "object",
            name: "ItemItem",
            referencePath: "#/components/schemas/ItemItem",
            properties: [
              {
                name: "id",
                type: "string",
              },
            ],
          },
        ],
      });
    });

    // ===================================
    // カテゴリ3: 統合的な振る舞い
    // ===================================
    /**
     * 仕様確認:
     * - ネストしたオブジェクトやインラインenumは、独立した型として抽出される
     * - 抽出された型は階層的な命名規則に従って命名される（例: Root, RootStatus, RootNested）
     * - 複数のモデルとenumが同時に抽出され、それぞれmodelsとenumsコレクションに集約される
     * - プロパティにvalidation情報が含まれる
     */
    it("should extract nested structures with hierarchical naming", () => {
      const schema: SchemaObjectWithNullable = {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["a", "b"],
          },
          nested: {
            type: "object",
            properties: {
              value: { type: "string" },
            },
          },
        },
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Root"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: { kind: "ref", name: "#/components/schemas/Root" },
        models: [
          {
            kind: "object",
            name: "Root",
            referencePath: "#/components/schemas/Root",
            properties: [
              {
                name: "status",
                type: { kind: "ref", name: "#/components/schemas/RootStatus" },
              },
              {
                name: "nested",
                type: { kind: "ref", name: "#/components/schemas/RootNested" },
              },
            ],
          },
          {
            kind: "enum",
            name: "RootStatus",
            referencePath: "#/components/schemas/RootStatus",
            type: "string",
            values: [
              { value: "a", name: "A" },
              { value: "b", name: "B" },
            ],
          },
          {
            kind: "object",
            name: "RootNested",
            referencePath: "#/components/schemas/RootNested",
            properties: [
              {
                name: "value",
                type: "string",
              },
            ],
          },
        ],
      });
    });

    /**
     * 仕様確認:
     * - 深いネスト構造（Object > Array[Object] > Object > Enum）での階層的な型抽出
     * - 配列内オブジェクトが更にオブジェクトやenumを含む場合の処理
     * - 階層的命名規則が深いネストでも正しく適用される
     */
    it("should extract deeply nested structures with array of objects", () => {
      const schema: SchemaObjectWithNullable = {
        type: "object",
        properties: {
          id: { type: "string" },
          posts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                author: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    role: {
                      type: "string",
                      enum: ["admin", "editor", "viewer"],
                    },
                  },
                },
              },
            },
          },
        },
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Blog"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: { kind: "ref", name: "#/components/schemas/Blog" },
        models: [
          {
            kind: "object",
            name: "Blog",
            referencePath: "#/components/schemas/Blog",
            properties: [
              {
                name: "id",
                type: "string",
              },
              {
                name: "posts",
                type: {
                  kind: "ref",
                  name: "#/components/schemas/BlogPosts",
                },
              },
            ],
          },
          {
            kind: "array",
            name: "BlogPosts",
            referencePath: "#/components/schemas/BlogPosts",
            itemType: {
              kind: "ref",
              name: "#/components/schemas/BlogPostsItem",
            },
          },
          {
            kind: "object",
            name: "BlogPostsItem",
            referencePath: "#/components/schemas/BlogPostsItem",
            properties: [
              {
                name: "title",
                type: "string",
              },
              {
                name: "author",
                type: {
                  kind: "ref",
                  name: "#/components/schemas/BlogPostsItemAuthor",
                },
              },
            ],
          },
          {
            kind: "object",
            name: "BlogPostsItemAuthor",
            referencePath: "#/components/schemas/BlogPostsItemAuthor",
            properties: [
              {
                name: "name",
                type: "string",
              },
              {
                name: "role",
                type: {
                  kind: "ref",
                  name: "#/components/schemas/BlogPostsItemAuthorRole",
                },
              },
            ],
          },
          {
            kind: "enum",
            name: "BlogPostsItemAuthorRole",
            referencePath: "#/components/schemas/BlogPostsItemAuthorRole",
            type: "string",
            values: [
              { value: "admin", name: "ADMIN" },
              { value: "editor", name: "EDITOR" },
              { value: "viewer", name: "VIEWER" },
            ],
          },
        ],
      });
    });

    /**
     * 仕様確認:
     * - トップレベルが配列の場合の処理（Array[Object] > Object > Enum）
     * - 配列要素内でのネストしたオブジェクトとenumの抽出
     * - 配列起点での階層的命名規則の適用
     */
    it("should extract nested structures starting with array", () => {
      const schema: SchemaObjectWithNullable = {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            metadata: {
              type: "object",
              properties: {
                created: { type: "string" },
                category: {
                  type: "string",
                  enum: ["product", "service", "other"],
                },
              },
            },
          },
        },
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Items"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/Items",
        },
        models: [
          {
            kind: "array",
            name: "Items",
            referencePath: "#/components/schemas/Items",
            itemType: { kind: "ref", name: "#/components/schemas/ItemsItem" },
          },
          {
            kind: "object",
            name: "ItemsItem",
            referencePath: "#/components/schemas/ItemsItem",
            properties: [
              {
                name: "id",
                type: "int",
              },
              {
                name: "name",
                type: "string",
              },
              {
                name: "metadata",
                type: {
                  kind: "ref",
                  name: "#/components/schemas/ItemsItemMetadata",
                },
              },
            ],
          },
          {
            kind: "object",
            name: "ItemsItemMetadata",
            referencePath: "#/components/schemas/ItemsItemMetadata",
            properties: [
              {
                name: "created",
                type: "string",
              },
              {
                name: "category",
                type: {
                  kind: "ref",
                  name: "#/components/schemas/ItemsItemMetadataCategory",
                },
              },
            ],
          },
          {
            kind: "enum",
            name: "ItemsItemMetadataCategory",
            referencePath: "#/components/schemas/ItemsItemMetadataCategory",
            type: "string",
            values: [
              { value: "product", name: "PRODUCT" },
              { value: "service", name: "SERVICE" },
              { value: "other", name: "OTHER" },
            ],
          },
        ],
      });
    });

    /**
     * 仕様確認:
     * - OpenAPI 3.1では、typeプロパティがなくてもpropertiesがあれば暗黙的にobject型として扱われる
     * - この場合、通常のobject型と同様に処理され、独立したモデルとして抽出される
     * - webhooks.yamlのPetスキーマのようなケースに対応
     */
    it("should handle implicit object type when properties exist without type", () => {
      const schema: SchemaObjectWithNullable = {
        // type: "object" がない
        properties: {
          id: { type: "integer", format: "int64" },
          name: { type: "string" },
        },
        required: ["id", "name"],
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Pet"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: { kind: "ref", name: "#/components/schemas/Pet" },
        models: [
          {
            kind: "object",
            name: "Pet",
            referencePath: "#/components/schemas/Pet",
            properties: [
              {
                name: "id",
                type: "long",
                required: true,
                validation: {
                  format: "int64",
                },
              },
              {
                name: "name",
                type: "string",
                required: true,
              },
            ],
          },
        ],
      });
    });

    // ===================================
    // カテゴリ4: 未対応機能の警告
    // ===================================
    it("should handle allOf composition", () => {
      const schema = {
        allOf: [
          { $ref: "#/components/schemas/Base" },
          { type: "object", properties: { extra: { type: "string" } } },
        ],
      } as SchemaObjectWithNullable;
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Composed"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/Composed",
        },
        models: [
          {
            kind: "allOf",
            name: "Composed",
            referencePath: "#/components/schemas/Composed",
            schemas: [
              { kind: "ref", name: "#/components/schemas/Base" },
              { kind: "ref", name: "#/components/schemas/Composed/allOf/1" },
            ],
          },
          {
            kind: "object",
            name: "ComposedAllOf1",
            referencePath: "#/components/schemas/Composed/allOf/1",
            properties: [
              {
                name: "extra",
                type: "string",
              },
            ],
          },
        ],
      });
    });

    it("should warn for oneOf and return empty result", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const schema = {
        oneOf: [{ type: "string" }, { type: "number" }],
      } as SchemaObjectWithNullable;
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "StringOrNumber"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({ type: null, models: [] });
      expect(warnSpy).toHaveBeenCalledWith(
        "oneOf is not supported yet: #/components/schemas/StringOrNumber",
      );
      warnSpy.mockRestore();
    });

    it("should warn for anyOf and return empty result", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const schema = {
        anyOf: [{ type: "string" }, { type: "null" }],
      } as SchemaObjectWithNullable;
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "NullableString"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({ type: null, models: [] });
      expect(warnSpy).toHaveBeenCalledWith(
        "anyOf is not supported yet: #/components/schemas/NullableString",
      );
      warnSpy.mockRestore();
    });

    it("should warn for discriminator and return empty result", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const schema = {
        oneOf: [
          { $ref: "#/components/schemas/Cat" },
          { $ref: "#/components/schemas/Dog" },
        ],
        discriminator: {
          propertyName: "petType",
        },
      } as SchemaObjectWithNullable;
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Pet"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({ type: null, models: [] });
      // oneOfが先にチェックされるため、oneOfの警告のみが出る
      expect(warnSpy).toHaveBeenCalledWith(
        "oneOf is not supported yet: #/components/schemas/Pet",
      );
      warnSpy.mockRestore();
    });

    it("should warn for not schema and return empty result", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const schema = {
        not: { type: "string" },
      } as SchemaObjectWithNullable;
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "NotString"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({ type: null, models: [] });
      expect(warnSpy).toHaveBeenCalledWith(
        "not schema is not supported yet: #/components/schemas/NotString",
      );
      warnSpy.mockRestore();
    });

    it("should return IRMap type for additionalProperties-only schemas", () => {
      const schema: SchemaObjectWithNullable = {
        type: "object",
        additionalProperties: { type: "string" },
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "StringMap"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/StringMap",
        },
        models: [
          {
            kind: "map",
            name: "StringMap",
            referencePath: "#/components/schemas/StringMap",
            valueType: "string",
          },
        ],
      });
    });

    it("should include additionalProperties in model when present with regular properties", () => {
      const schema: SchemaObjectWithNullable = {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        additionalProperties: { type: "string" },
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Mixed"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      // Should generate the model with additionalProperties
      expect(result).toEqual({
        type: { kind: "ref", name: "#/components/schemas/Mixed" },
        models: [
          {
            kind: "object",
            name: "Mixed",
            referencePath: "#/components/schemas/Mixed",
            properties: [
              {
                name: "id",
                type: "string",
              },
            ],
            additionalProperties: "string",
          },
        ],
      });
    });

    it("should generate model for empty object without additionalProperties", () => {
      const schema: SchemaObjectWithNullable = {
        type: "object",
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "EmptyObject"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      // Empty objects without additionalProperties should still generate a model
      expect(result).toEqual({
        type: { kind: "ref", name: "#/components/schemas/EmptyObject" },
        models: [
          {
            kind: "object",
            name: "EmptyObject",
            referencePath: "#/components/schemas/EmptyObject",
            properties: [],
          },
        ],
      });
    });

    it("should handle additionalProperties with array type", () => {
      const schema: SchemaObjectWithNullable = {
        type: "object",
        additionalProperties: {
          type: "array",
          items: { type: "string" },
        },
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "ArrayMap"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/ArrayMap",
        },
        models: [
          {
            kind: "map",
            name: "ArrayMap",
            referencePath: "#/components/schemas/ArrayMap",
            valueType: {
              kind: "ref",
              name: "#/components/schemas/ArrayMapValue",
            },
          },
          {
            kind: "array",
            name: "ArrayMapValue",
            referencePath: "#/components/schemas/ArrayMapValue",
            itemType: "string",
          },
        ],
      });
    });

    it("should handle additionalProperties with reference type", () => {
      const schema: SchemaObjectWithNullable = {
        type: "object",
        additionalProperties: {
          $ref: "#/components/schemas/MetadataValue",
        },
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "MetadataMap"],
        rootSegment: "components",
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/MetadataMap",
        },
        models: [
          {
            kind: "map",
            name: "MetadataMap",
            referencePath: "#/components/schemas/MetadataMap",
            valueType: {
              kind: "ref",
              name: "#/components/schemas/MetadataValue",
            },
          },
        ],
      });
    });
  });
}
