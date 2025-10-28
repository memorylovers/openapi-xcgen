/**
 * @file allOf型のSchemaObjectをIRAllOfModelに変換するVisitor
 *
 * このVisitorはallOfスキーマ構造の処理に専念し、
 * 各サブスキーマの型判定は`visitSchema`に委譲します。
 *
 * @bnf <allof-schema> - allOfを持つスキーマオブジェクト
 * @bnf-fields
 *   - `allOf`: サブスキーマの配列
 *   - `description`: モデルの説明（省略可）
 */

import { consola } from "consola";
import type {
  IRAllOfModel,
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
import type { AllOfContext, VisitorContext } from "../../types";
import { type SchemaVisitorResult, visitSchema } from "./schema-visitor";

/**
 * allOf型のSchemaObjectをIRAllOfModelに変換
 *
 * 責務:
 * - allOfスキーマ構造の処理（サブスキーマの展開）
 * - 各サブスキーマの型判定を`visitSchema`に委譲
 * - インラインスキーマの自動モデル化
 * - ネストされたモデルの収集と集約
 *
 * @param schema - OpenAPI SchemaObject (allOfを持つ)
 * @param context - Visitor context with model name
 * @returns SchemaVisitorResult型の結果（allOfモデル、ネストしたモデル）
 *
 * @example OpenAPI YAML
 * ```yaml
 * Extended:
 *   allOf:
 *     - $ref: '#/components/schemas/Base'
 *     - type: object
 *       properties:
 *         email:
 *           type: string
 * ```
 *
 * @example TypeSpec相当
 * ```typespec
 * model Extended extends Base {
 *   email: string;
 * }
 * ```
 */
export function visitAllOf(
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
    consola.warn("Invalid model name for allOf: empty or whitespace only");
    return result;
  }

  // allOfプロパティの検証
  if (!("allOf" in schema) || !schema.allOf || !Array.isArray(schema.allOf)) {
    consola.warn(
      `Invalid allOf schema: ${buildReferencePath(context.documentPath)}`,
    );
    return result;
  }

  // 各サブスキーマを処理
  const schemas: IRType[] = [];
  const nestedModels: IRModel[] = [];

  for (let i = 0; i < schema.allOf.length; i++) {
    const subSchema = schema.allOf[i] as SchemaObject;

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
    // 生成されるモデル名: {親名}AllOf{インデックス} (例: ExtendedAllOf1)
    const inlineModelName = buildInlineModelName(name, "allOf", i);
    const inlineContext: AllOfContext = {
      kind: "allOf",
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
        `Skipping allOf subschema at index ${i} in ${name}: invalid type`,
      );
    }
  }

  // 拡張フィールドを抽出
  const extensions = extractExtensions(schema);

  // allOfモデルを作成
  const allOfModel: IRAllOfModel = {
    kind: "allOf",
    name,
    referencePath: buildReferencePath(context.documentPath),
    ...(schema.description && { description: schema.description }),
    schemas,
    ...(extensions && { extensions }),
  };

  // allOfモデルへの参照を作成
  const allOfRef: IRRef = {
    kind: "ref",
    name: allOfModel.referencePath,
  };

  // メインモデルを最初に、ネストしたモデルをその後に追加
  result.models = [allOfModel, ...nestedModels];
  result.type = allOfRef;

  return result;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitAllOf", () => {
    it("should handle $ref + object composition", () => {
      const schema: SchemaObjectWithNullable = {
        allOf: [
          { $ref: "#/components/schemas/Base" },
          {
            type: "object",
            properties: {
              email: { type: "string" },
            },
          },
        ],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Extended"],
        rootSegment: "components",
      };

      const result = visitAllOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/Extended",
        },
        models: [
          {
            kind: "allOf",
            name: "Extended",
            referencePath: "#/components/schemas/Extended",
            schemas: [
              { kind: "ref", name: "#/components/schemas/Base" },
              { kind: "ref", name: "#/components/schemas/ExtendedAllOf1" },
            ],
          },
          {
            kind: "object",
            name: "ExtendedAllOf1",
            referencePath: "#/components/schemas/ExtendedAllOf1",
            properties: [
              {
                name: "email",
                type: "string",
              },
            ],
          },
        ],
      });
    });

    it("should handle multiple $refs", () => {
      const schema: SchemaObjectWithNullable = {
        allOf: [
          { $ref: "#/components/schemas/Base" },
          { $ref: "#/components/schemas/Timestamps" },
        ],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Extended"],
        rootSegment: "components",
      };

      const result = visitAllOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/Extended",
        },
        models: [
          {
            kind: "allOf",
            name: "Extended",
            referencePath: "#/components/schemas/Extended",
            schemas: [
              { kind: "ref", name: "#/components/schemas/Base" },
              { kind: "ref", name: "#/components/schemas/Timestamps" },
            ],
          },
        ],
      });
    });

    it("should handle description", () => {
      const schema: SchemaObjectWithNullable = {
        description: "Extended model with base properties",
        allOf: [{ $ref: "#/components/schemas/Base" }],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Extended"],
        rootSegment: "components",
      };

      const result = visitAllOf(schema, context);

      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/Extended",
        },
        models: [
          {
            kind: "allOf",
            name: "Extended",
            referencePath: "#/components/schemas/Extended",
            description: "Extended model with base properties",
            schemas: [{ kind: "ref", name: "#/components/schemas/Base" }],
          },
        ],
      });
    });

    it("should warn for empty model name", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObjectWithNullable = {
        allOf: [{ $ref: "#/components/schemas/Base" }],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", ""],
        rootSegment: "components",
      };

      const result = visitAllOf(schema, context);

      expect(result).toEqual({ type: null, models: [] });
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid model name for allOf: empty or whitespace only",
      );

      warnSpy.mockRestore();
    });

    it("should warn for invalid allOf schema", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema = {
        type: "object",
      } as SchemaObjectWithNullable;

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Invalid"],
        rootSegment: "components",
      };

      const result = visitAllOf(schema, context);

      expect(result).toEqual({ type: null, models: [] });
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid allOf schema: #/components/schemas/Invalid",
      );

      warnSpy.mockRestore();
    });
  });
}
