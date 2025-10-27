/**
 * @file oneOf型のSchemaObjectをIRUnionModelに変換するVisitor
 *
 * このVisitorはoneOfスキーマ構造の処理に専念し、
 * 各サブスキーマの型判定は`visitSchema`に委譲します。
 *
 * @bnf <oneof-schema> - oneOfを持つスキーマオブジェクト
 * @bnf-fields
 *   - `oneOf`: サブスキーマの配列
 *   - `description`: モデルの説明（省略可）
 *   - `discriminator`: 型判別情報（省略可）
 */

import { consola } from "consola";
import type {
  IRModel,
  IRRef,
  IRType,
  IRUnionModel,
  SchemaObject,
  SchemaObjectWithNullable,
} from "../../../types";
import { isReferenceObject } from "../../../types/guards";
import {
  buildReferencePath,
  extractExtensions,
  getModelName,
} from "../../helpers";
import { buildInlineModelName } from "../../helpers/build-inline-model-name";
import { buildInlineSchemaPath } from "../../helpers/build-inline-schema-path";
import type { OneOfContext, VisitorContext } from "../../types";
import { type SchemaVisitorResult, visitSchema } from "./schema-visitor";

/**
 * スキーマがnull型かどうかを判定
 * OpenAPI 3.0: {type: null} は無効だが、OpenAPI 3.1では有効
 * OpenAPI 3.1: {type: 'null'} または {type: null}
 */
function isNullType(schema: SchemaObject): boolean {
  if (isReferenceObject(schema)) return false;
  return schema.type === "null" || schema.type === null;
}

/**
 * oneOf配列からnullableパターンを検出
 * パターン: oneOfにnull型が含まれる場合（要素数は問わない）
 *
 * OpenAPI 3.1では以下のような表現が可能:
 * - oneOf: [{$ref: X}, {type: 'null'}]  (2要素)
 * - oneOf: [{$ref: X}, {$ref: Y}, {type: 'null'}]  (3要素以上)
 *
 * @returns nullable=trueの場合、non-null型のみを返す
 */
function detectNullablePattern(schemas: SchemaObject[]): {
  isNullable: boolean;
  nonNullSchemas: SchemaObject[];
} {
  // oneOfの中にnull型が含まれているかチェック
  const hasNullType = schemas.some(isNullType);

  if (hasNullType) {
    // null型を除外したスキーマを返す
    const nonNullSchemas = schemas.filter((schema) => !isNullType(schema));
    return { isNullable: true, nonNullSchemas };
  }

  // null型が含まれていない場合はnullableパターンではない
  return { isNullable: false, nonNullSchemas: schemas };
}

/**
 * oneOf型のSchemaObjectをIRUnionModelに変換
 *
 * 責務:
 * - oneOfスキーマ構造の処理（サブスキーマの展開）
 * - discriminatorの処理
 * - 各サブスキーマの型判定を`visitSchema`に委譲
 * - インラインスキーマの自動モデル化
 * - ネストされたモデルの収集と集約
 *
 * @param schema - OpenAPI SchemaObject (oneOfを持つ)
 * @param context - Visitor context with model name
 * @returns SchemaVisitorResult型の結果（oneOfモデル、ネストしたモデル）
 *
 * @example OpenAPI YAML - シンプルなoneOf
 * ```yaml
 * Result:
 *   oneOf:
 *     - $ref: '#/components/schemas/Success'
 *     - $ref: '#/components/schemas/Error'
 * ```
 *
 * @example OpenAPI YAML - discriminator付き
 * ```yaml
 * Pet:
 *   oneOf:
 *     - $ref: '#/components/schemas/Cat'
 *     - $ref: '#/components/schemas/Dog'
 *   discriminator:
 *     propertyName: petType
 * ```
 *
 * @example TypeSpec相当
 * ```typespec
 * @discriminator("petType")
 * union Pet {
 *   cat: Cat,
 *   dog: Dog,
 * }
 * ```
 */
export function visitOneOf(
  schema: SchemaObjectWithNullable,
  context: VisitorContext,
): SchemaVisitorResult {
  const result: SchemaVisitorResult = {
    type: null,
    models: [],
  };

  // コンテキストからモデル名を取得
  const name = getModelName(context);

  // 名前の妥当性チェック
  if (!name.trim()) {
    consola.warn("Invalid model name for oneOf: empty or whitespace only");
    return result;
  }

  // oneOfプロパティの検証
  if (!("oneOf" in schema) || !schema.oneOf || !Array.isArray(schema.oneOf)) {
    consola.warn(
      `Invalid oneOf schema: ${buildReferencePath(context.documentPath)}`,
    );
    return result;
  }

  // nullableパターン検出（oneOf: [{type: X}, {type: 'null'}]）
  const { isNullable } = detectNullablePattern(schema.oneOf as SchemaObject[]);

  // 各サブスキーマを処理（nullableの場合、null型はスキップ）
  const types: IRType[] = [];
  const nestedModels: IRModel[] = [];

  for (let i = 0; i < schema.oneOf.length; i++) {
    const subSchema = schema.oneOf[i] as SchemaObject;

    // nullableパターンの場合、null型はスキップ
    if (isNullable && isNullType(subSchema)) {
      continue;
    }

    // $refの場合はそのまま使用
    if (isReferenceObject(subSchema)) {
      const refType: IRRef = {
        kind: "ref",
        name: subSchema.$ref,
      };
      types.push(refType);
      continue;
    }

    // インラインスキーマの場合は自動モデル化
    // 生成されるモデル名: {親名}OneOf{インデックス} (例: ResultOneOf1)
    const inlineModelName = buildInlineModelName(name, "oneOf", i);
    const inlineContext: OneOfContext = {
      kind: "oneOf",
      documentPath: buildInlineSchemaPath(context, inlineModelName),
      rootSegment: "components",
      parentSchemaName: name,
      index: i,
    };

    // visitSchemaで処理（getModelNameが自動的に適切な名前を生成）
    const subResult = visitSchema(subSchema, inlineContext);

    // ネストしたモデルを収集
    nestedModels.push(...subResult.models);

    // 型が取得できた場合のみ追加
    if (subResult.type) {
      types.push(subResult.type);
    } else {
      consola.warn(
        `Skipping oneOf subschema at index ${i} in ${name}: invalid type`,
      );
    }
  }

  // 拡張フィールドを抽出
  const extensions = extractExtensions(schema);

  // oneOfモデルを作成
  const unionModel: IRUnionModel = {
    kind: "union",
    name,
    referencePath: buildReferencePath(context.documentPath),
    ...(schema.description && { description: schema.description }),
    ...(isNullable && { nullable: true }),
    ...(schema.discriminator && {
      discriminator: {
        propertyName: schema.discriminator.propertyName,
        ...(schema.discriminator.mapping && {
          mapping: schema.discriminator.mapping,
        }),
      },
    }),
    types,
    ...(extensions && { extensions }),
  };

  // oneOfモデルへの参照を作成
  const unionRef: IRRef = {
    kind: "ref",
    name: unionModel.referencePath,
  };

  // メインモデルを最初に、ネストしたモデルをその後に追加
  result.models = [unionModel, ...nestedModels];
  result.type = unionRef;

  return result;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitOneOf", () => {
    it("should handle $ref + $ref composition", () => {
      const schema: SchemaObjectWithNullable = {
        oneOf: [
          { $ref: "#/components/schemas/Cat" },
          { $ref: "#/components/schemas/Dog" },
        ],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Pet"],
        rootSegment: "components",
      };

      const result = visitOneOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/Pet",
        },
        models: [
          {
            kind: "union",
            name: "Pet",
            referencePath: "#/components/schemas/Pet",
            types: [
              { kind: "ref", name: "#/components/schemas/Cat" },
              { kind: "ref", name: "#/components/schemas/Dog" },
            ],
          },
        ],
      });
    });

    it("should handle $ref + object composition", () => {
      const schema: SchemaObjectWithNullable = {
        oneOf: [
          { $ref: "#/components/schemas/Success" },
          {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        ],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Result"],
        rootSegment: "components",
      };

      const result = visitOneOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/Result",
        },
        models: [
          {
            kind: "union",
            name: "Result",
            referencePath: "#/components/schemas/Result",
            types: [
              { kind: "ref", name: "#/components/schemas/Success" },
              { kind: "ref", name: "#/components/schemas/ResultOneOf1" },
            ],
          },
          {
            kind: "object",
            name: "ResultOneOf1",
            referencePath: "#/components/schemas/ResultOneOf1",
            properties: [
              {
                name: "error",
                type: "string",
              },
            ],
          },
        ],
      });
    });

    it("should handle discriminator", () => {
      const schema: SchemaObjectWithNullable = {
        oneOf: [
          { $ref: "#/components/schemas/Cat" },
          { $ref: "#/components/schemas/Dog" },
        ],
        discriminator: {
          propertyName: "petType",
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Pet"],
        rootSegment: "components",
      };

      const result = visitOneOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/Pet",
        },
        models: [
          {
            kind: "union",
            name: "Pet",
            referencePath: "#/components/schemas/Pet",
            discriminator: {
              propertyName: "petType",
            },
            types: [
              { kind: "ref", name: "#/components/schemas/Cat" },
              { kind: "ref", name: "#/components/schemas/Dog" },
            ],
          },
        ],
      });
    });

    it("should handle discriminator with mapping", () => {
      const schema: SchemaObjectWithNullable = {
        oneOf: [
          { $ref: "#/components/schemas/Cat" },
          { $ref: "#/components/schemas/Dog" },
        ],
        discriminator: {
          propertyName: "type",
          mapping: {
            cat: "#/components/schemas/Cat",
            dog: "#/components/schemas/Dog",
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Pet"],
        rootSegment: "components",
      };

      const result = visitOneOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/Pet",
        },
        models: [
          {
            kind: "union",
            name: "Pet",
            referencePath: "#/components/schemas/Pet",
            discriminator: {
              propertyName: "type",
              mapping: {
                cat: "#/components/schemas/Cat",
                dog: "#/components/schemas/Dog",
              },
            },
            types: [
              { kind: "ref", name: "#/components/schemas/Cat" },
              { kind: "ref", name: "#/components/schemas/Dog" },
            ],
          },
        ],
      });
    });

    it("should handle description", () => {
      const schema: SchemaObjectWithNullable = {
        description: "Pet union type",
        oneOf: [
          { $ref: "#/components/schemas/Cat" },
          { $ref: "#/components/schemas/Dog" },
        ],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Pet"],
        rootSegment: "components",
      };

      const result = visitOneOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/Pet",
        },
        models: [
          {
            kind: "union",
            name: "Pet",
            referencePath: "#/components/schemas/Pet",
            description: "Pet union type",
            types: [
              { kind: "ref", name: "#/components/schemas/Cat" },
              { kind: "ref", name: "#/components/schemas/Dog" },
            ],
          },
        ],
      });
    });

    it("should warn for empty model name", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObjectWithNullable = {
        oneOf: [{ $ref: "#/components/schemas/Cat" }],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", ""],
        rootSegment: "components",
      };

      const result = visitOneOf(schema, context);

      expect(result).toEqual({ type: null, models: [] });
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid model name for oneOf: empty or whitespace only",
      );

      warnSpy.mockRestore();
    });

    it("should warn for invalid oneOf schema", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema = {
        type: "object",
      } as SchemaObjectWithNullable;

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Invalid"],
        rootSegment: "components",
      };

      const result = visitOneOf(schema, context);

      expect(result).toEqual({ type: null, models: [] });
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid oneOf schema: #/components/schemas/Invalid",
      );

      warnSpy.mockRestore();
    });

    it("should detect nullable pattern with $ref + null", () => {
      const schema: SchemaObjectWithNullable = {
        oneOf: [{ $ref: "#/components/schemas/Success" }, { type: "null" }],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "NullableResult"],
        rootSegment: "components",
      };

      const result = visitOneOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/NullableResult",
        },
        models: [
          {
            kind: "union",
            name: "NullableResult",
            referencePath: "#/components/schemas/NullableResult",
            nullable: true,
            types: [{ kind: "ref", name: "#/components/schemas/Success" }],
          },
        ],
      });
    });

    it("should detect nullable pattern with null + $ref (null first)", () => {
      const schema: SchemaObjectWithNullable = {
        oneOf: [{ type: "null" }, { $ref: "#/components/schemas/User" }],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "NullableUser"],
        rootSegment: "components",
      };

      const result = visitOneOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/NullableUser",
        },
        models: [
          {
            kind: "union",
            name: "NullableUser",
            referencePath: "#/components/schemas/NullableUser",
            nullable: true,
            types: [{ kind: "ref", name: "#/components/schemas/User" }],
          },
        ],
      });
    });

    it("should detect nullable pattern with 3+ schemas (string | number | null)", () => {
      const schema: SchemaObjectWithNullable = {
        oneOf: [{ type: "string" }, { type: "number" }, { type: "null" }],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "MultiTypeNullable"],
        rootSegment: "components",
      };

      const result = visitOneOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/MultiTypeNullable",
        },
        models: [
          {
            kind: "union",
            name: "MultiTypeNullable",
            referencePath: "#/components/schemas/MultiTypeNullable",
            nullable: true,
            types: ["string", "double"],
          },
        ],
      });
    });

    it("should NOT detect nullable pattern with 2 non-null schemas", () => {
      const schema: SchemaObjectWithNullable = {
        oneOf: [{ type: "string" }, { type: "number" }],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "StringOrNumber"],
        rootSegment: "components",
      };

      const result = visitOneOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/StringOrNumber",
        },
        models: [
          {
            kind: "union",
            name: "StringOrNumber",
            referencePath: "#/components/schemas/StringOrNumber",
            types: ["string", "double"],
          },
        ],
      });
    });
  });
}
