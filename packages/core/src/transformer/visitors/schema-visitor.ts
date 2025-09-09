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

import type { SchemaObjectWithNullable } from "../../types/index";
import type { IRModel, IRType } from "../../types/ir/index";
import type { VisitorContext } from "../types";
import { visitEnum } from "./enum-visitor";
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
  schema: SchemaObjectWithNullable,
  context: VisitorContext,
): SchemaVisitorResult {
  const result: SchemaVisitorResult = {
    type: null,
    models: [],
  };

  // documentPathから名前を抽出（最後の要素がスキーマ名）
  const name = context.documentPath[context.documentPath.length - 1] || "";

  // enum型の処理
  if (schema.enum !== undefined) {
    const enumResult = visitEnum(schema, context);
    if (enumResult.models.length === 0) return result;

    result.models.push(...enumResult.models);
    result.type = { kind: "ref", name };
    return result;
  }
  // object型の処理
  else if (schema.type === "object") {
    // visitObjectでobject処理（ネスト構造の抽出含む）を完結
    const objectResult = visitObject(schema, context);

    // visitObjectの結果をマージ
    result.models.push(...objectResult.models);

    // メインモデルが作成された場合は参照型を設定
    if (objectResult.models.length > 0) {
      result.type = { kind: "ref", name };
    }
    return result;
  }
  // 配列型の特別処理（配列の要素がobjectの場合）
  else if (schema.type === "array" && schema.items) {
    const itemSchema = schema.items as SchemaObjectWithNullable;

    // 配列の要素がobject型の場合、モデルとして抽出
    if (itemSchema.type === "object") {
      const itemResult = visitSchema(itemSchema, context);

      // 抽出されたモデルを集約
      result.models.push(...itemResult.models);

      // 配列型を構築（要素は参照型）
      if (itemResult.models.length > 0) {
        result.type = {
          kind: "array",
          itemType: { kind: "ref", name },
        };
      } else {
        // モデルが生成されなかった場合は通常の配列処理
        result.type = visitType(schema, context);
      }
      return result;
    }
    // 配列の要素がobject以外の場合は通常処理
    else {
      result.type = visitType(schema, context);
      return result;
    }
  }
  // その他の型（プリミティブなど）
  else {
    result.type = visitType(schema, context);
    return result;
  }
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

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
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: { kind: "ref", name: "Status" },
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
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: { kind: "ref", name: "User" },
        models: [
          {
            kind: "object",
            name: "User",
            referencePath: "#/components/schemas/User",
            properties: [
              {
                name: "id",
                type: "string",
                required: false,
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
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: { kind: "ref", name: "Foo" },
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
      };

      const result = visitSchema(schema, context);

      // typeフィールドがnumberでもenumフィールドが優先される
      // enum-visitorはtypeフィールドをそのまま使用する
      expect(result).toEqual({
        type: { kind: "ref", name: "Status" },
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
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: { kind: "ref", name: "Priority" },
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
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: {
          kind: "array",
          itemType: { kind: "ref", name: "Item" },
        },
        models: [
          {
            kind: "object",
            name: "Item",
            referencePath: "#/components/schemas/Item",
            properties: [
              {
                name: "id",
                type: "string",
                required: false,
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
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: { kind: "ref", name: "Root" },
        models: [
          {
            kind: "object",
            name: "Root",
            referencePath: "#/components/schemas/Root",
            properties: [
              {
                name: "status",
                type: { kind: "ref", name: "RootStatus" },
                required: false,
              },
              {
                name: "nested",
                type: { kind: "ref", name: "RootNested" },
                required: false,
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
                required: false,
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
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: { kind: "ref", name: "Blog" },
        models: [
          {
            kind: "object",
            name: "Blog",
            referencePath: "#/components/schemas/Blog",
            properties: [
              {
                name: "id",
                type: "string",
                required: false,
              },
              {
                name: "posts",
                type: {
                  kind: "array",
                  itemType: { kind: "ref", name: "BlogPosts" },
                },
                required: false,
              },
            ],
          },
          {
            kind: "object",
            name: "BlogPosts",
            referencePath: "#/components/schemas/BlogPosts",
            properties: [
              {
                name: "title",
                type: "string",
                required: false,
              },
              {
                name: "author",
                type: { kind: "ref", name: "BlogPostsAuthor" },
                required: false,
              },
            ],
          },
          {
            kind: "object",
            name: "BlogPostsAuthor",
            referencePath: "#/components/schemas/BlogPostsAuthor",
            properties: [
              {
                name: "name",
                type: "string",
                required: false,
              },
              {
                name: "role",
                type: { kind: "ref", name: "BlogPostsAuthorRole" },
                required: false,
              },
            ],
          },
          {
            kind: "enum",
            name: "BlogPostsAuthorRole",
            referencePath: "#/components/schemas/BlogPostsAuthorRole",
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
      };

      const result = visitSchema(schema, context);

      expect(result).toEqual({
        type: {
          kind: "array",
          itemType: { kind: "ref", name: "Items" },
        },
        models: [
          {
            kind: "object",
            name: "Items",
            referencePath: "#/components/schemas/Items",
            properties: [
              {
                name: "id",
                type: "int",
                required: false,
              },
              {
                name: "name",
                type: "string",
                required: false,
              },
              {
                name: "metadata",
                type: { kind: "ref", name: "ItemsMetadata" },
                required: false,
              },
            ],
          },
          {
            kind: "object",
            name: "ItemsMetadata",
            referencePath: "#/components/schemas/ItemsMetadata",
            properties: [
              {
                name: "created",
                type: "string",
                required: false,
              },
              {
                name: "category",
                type: { kind: "ref", name: "ItemsMetadataCategory" },
                required: false,
              },
            ],
          },
          {
            kind: "enum",
            name: "ItemsMetadataCategory",
            referencePath: "#/components/schemas/ItemsMetadataCategory",
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
  });
}
