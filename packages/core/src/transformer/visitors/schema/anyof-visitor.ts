/**
 * @file anyOf型のSchemaObjectをIRAnyOfModelに変換するVisitor
 *
 * このVisitorはanyOfスキーマ構造の処理に専念し、
 * 各サブスキーマの型判定は`visitSchema`に委譲します。
 *
 * @bnf <anyof-schema> - anyOfを持つスキーマオブジェクト
 * @bnf-fields
 *   - `anyOf`: サブスキーマの配列
 *   - `description`: モデルの説明（省略可）
 */

import { consola } from "consola";
import type {
  IRAnyOfModel,
  IRModel,
  IRRef,
  IRType,
  SchemaObject,
  SchemaObjectWithNullable,
} from "../../../types";
import { isReferenceObject } from "../../../types/guards";
import {
  buildInlineModelName,
  buildReferencePath,
  extractExtensions,
  getModelName,
} from "../../helpers";
import type { AnyOfContext, VisitorContext } from "../../types";
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
 * anyOf配列からnullableパターンを検出
 * パターン: anyOfにnull型が含まれる場合（要素数は問わない）
 *
 * OpenAPI 3.1では以下のような表現が可能:
 * - anyOf: [{type: X}, {type: 'null'}]  (2要素)
 * - anyOf: [{type: X}, {type: Y}, {type: 'null'}]  (3要素以上)
 *
 * @returns nullable=trueの場合、non-null型のみを返す
 */
function detectNullablePattern(schemas: SchemaObject[]): {
  isNullable: boolean;
  nonNullSchemas: SchemaObject[];
} {
  // anyOfの中にnull型が含まれているかチェック
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
 * anyOf型のSchemaObjectをIRAnyOfModelに変換
 *
 * 責務:
 * - anyOfスキーマ構造の処理（サブスキーマの展開）
 * - 各サブスキーマの型判定を`visitSchema`に委譲
 * - インラインスキーマの自動モデル化
 * - ネストされたモデルの収集と集約
 *
 * @param schema - OpenAPI SchemaObject (anyOfを持つ)
 * @param context - Visitor context with model name
 * @returns SchemaVisitorResult型の結果（anyOfモデル、ネストしたモデル）
 *
 * @example OpenAPI YAML
 * ```yaml
 * Fruit:
 *   anyOf:
 *     - $ref: '#/components/schemas/Apple'
 *     - $ref: '#/components/schemas/Banana'
 * ```
 *
 * @example TypeSpec相当
 * ```typespec
 * union Fruit {
 *   apple: Apple,
 *   banana: Banana,
 * }
 * ```
 */
export function visitAnyOf(
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
    consola.warn("Invalid model name for anyOf: empty or whitespace only");
    return result;
  }

  // anyOfプロパティの検証
  if (!("anyOf" in schema) || !schema.anyOf || !Array.isArray(schema.anyOf)) {
    consola.warn(
      `Invalid anyOf schema: ${buildReferencePath(context.documentPath)}`,
    );
    return result;
  }

  // nullableパターン検出（anyOf: [{type: X}, {type: 'null'}]）
  const { isNullable } = detectNullablePattern(schema.anyOf as SchemaObject[]);

  // 各サブスキーマを処理（nullableの場合、null型はスキップ）
  const schemas: IRType[] = [];
  const nestedModels: IRModel[] = [];

  for (let i = 0; i < schema.anyOf.length; i++) {
    const subSchema = schema.anyOf[i] as SchemaObject;

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
      schemas.push(refType);
      continue;
    }

    // インラインスキーマの場合は自動モデル化
    // 生成されるモデル名: {親名}AnyOf{インデックス} (例: FruitAnyOf1)
    const inlineModelName = buildInlineModelName(name, "anyOf", i);
    const inlineContext: AnyOfContext = {
      kind: "anyOf",
      documentPath: [...context.documentPath.slice(0, -1), inlineModelName],
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
      schemas.push(subResult.type);
    } else {
      consola.warn(
        `Skipping anyOf subschema at index ${i} in ${name}: invalid type`,
      );
    }
  }

  // 拡張フィールドを抽出
  const extensions = extractExtensions(schema);

  // anyOfモデルを作成
  const anyOfModel: IRAnyOfModel = {
    kind: "anyOf",
    name,
    referencePath: buildReferencePath(context.documentPath),
    ...(schema.description && { description: schema.description }),
    ...(isNullable && { nullable: true }),
    schemas,
    ...(extensions && { extensions }),
  };

  // anyOfモデルへの参照を作成
  const anyOfRef: IRRef = {
    kind: "ref",
    name: anyOfModel.referencePath,
  };

  // メインモデルを最初に、ネストしたモデルをその後に追加
  result.models = [anyOfModel, ...nestedModels];
  result.type = anyOfRef;

  return result;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitAnyOf", () => {
    it("should handle $ref + $ref composition", () => {
      const schema: SchemaObjectWithNullable = {
        anyOf: [
          { $ref: "#/components/schemas/Apple" },
          { $ref: "#/components/schemas/Banana" },
        ],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Fruit"],
        rootSegment: "components",
      };

      const result = visitAnyOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/Fruit",
        },
        models: [
          {
            kind: "anyOf",
            name: "Fruit",
            referencePath: "#/components/schemas/Fruit",
            schemas: [
              { kind: "ref", name: "#/components/schemas/Apple" },
              { kind: "ref", name: "#/components/schemas/Banana" },
            ],
          },
        ],
      });
    });

    it("should handle $ref + object composition", () => {
      const schema: SchemaObjectWithNullable = {
        anyOf: [
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
        documentPath: ["components", "schemas", "Response"],
        rootSegment: "components",
      };

      const result = visitAnyOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/Response",
        },
        models: [
          {
            kind: "anyOf",
            name: "Response",
            referencePath: "#/components/schemas/Response",
            schemas: [
              { kind: "ref", name: "#/components/schemas/Success" },
              { kind: "ref", name: "#/components/schemas/ResponseAnyOf1" },
            ],
          },
          {
            kind: "object",
            name: "ResponseAnyOf1",
            referencePath: "#/components/schemas/ResponseAnyOf1",
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

    it("should handle description", () => {
      const schema: SchemaObjectWithNullable = {
        description: "Union of Apple and Banana",
        anyOf: [
          { $ref: "#/components/schemas/Apple" },
          { $ref: "#/components/schemas/Banana" },
        ],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Fruit"],
        rootSegment: "components",
      };

      const result = visitAnyOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/Fruit",
        },
        models: [
          {
            kind: "anyOf",
            name: "Fruit",
            referencePath: "#/components/schemas/Fruit",
            description: "Union of Apple and Banana",
            schemas: [
              { kind: "ref", name: "#/components/schemas/Apple" },
              { kind: "ref", name: "#/components/schemas/Banana" },
            ],
          },
        ],
      });
    });

    it("should warn for empty model name", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObjectWithNullable = {
        anyOf: [{ $ref: "#/components/schemas/Apple" }],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", ""],
        rootSegment: "components",
      };

      const result = visitAnyOf(schema, context);

      expect(result).toEqual({ type: null, models: [] });
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid model name for anyOf: empty or whitespace only",
      );

      warnSpy.mockRestore();
    });

    it("should warn for invalid anyOf schema", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema = {
        type: "object",
      } as SchemaObjectWithNullable;

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Invalid"],
        rootSegment: "components",
      };

      const result = visitAnyOf(schema, context);

      expect(result).toEqual({ type: null, models: [] });
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid anyOf schema: #/components/schemas/Invalid",
      );

      warnSpy.mockRestore();
    });

    it("should detect nullable pattern with string + null", () => {
      const schema: SchemaObjectWithNullable = {
        anyOf: [{ type: "string" }, { type: "null" }],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "NullableString"],
        rootSegment: "components",
      };

      const result = visitAnyOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/NullableString",
        },
        models: [
          {
            kind: "anyOf",
            name: "NullableString",
            referencePath: "#/components/schemas/NullableString",
            nullable: true,
            schemas: ["string"],
          },
        ],
      });
    });

    it("should detect nullable pattern with null + ref (null first)", () => {
      const schema: SchemaObjectWithNullable = {
        anyOf: [{ type: "null" }, { $ref: "#/components/schemas/User" }],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "NullableUser"],
        rootSegment: "components",
      };

      const result = visitAnyOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/NullableUser",
        },
        models: [
          {
            kind: "anyOf",
            name: "NullableUser",
            referencePath: "#/components/schemas/NullableUser",
            nullable: true,
            schemas: [{ kind: "ref", name: "#/components/schemas/User" }],
          },
        ],
      });
    });

    it("should detect nullable pattern with 3+ schemas (string | number | null)", () => {
      const schema: SchemaObjectWithNullable = {
        anyOf: [{ type: "string" }, { type: "number" }, { type: "null" }],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "MultiTypeNullable"],
        rootSegment: "components",
      };

      const result = visitAnyOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/MultiTypeNullable",
        },
        models: [
          {
            kind: "anyOf",
            name: "MultiTypeNullable",
            referencePath: "#/components/schemas/MultiTypeNullable",
            nullable: true,
            schemas: ["string", "double"],
          },
        ],
      });
    });

    it("should NOT detect nullable pattern with 2 non-null schemas", () => {
      const schema: SchemaObjectWithNullable = {
        anyOf: [{ type: "string" }, { type: "number" }],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "StringOrNumber"],
        rootSegment: "components",
      };

      const result = visitAnyOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/StringOrNumber",
        },
        models: [
          {
            kind: "anyOf",
            name: "StringOrNumber",
            referencePath: "#/components/schemas/StringOrNumber",
            schemas: ["string", "double"],
          },
        ],
      });
    });
  });
}
