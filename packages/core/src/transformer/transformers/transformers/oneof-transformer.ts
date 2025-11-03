/**
 * OneOf Transformer - v2 Transformer Architecture
 *
 * oneOfスキーマをIRUnionModelに変換します。
 * トラバーサル（各サブスキーマ訪問）は composition-traverser に委譲します。
 */

import type { IRUnionModel, SchemaObject } from "../../../types";
import { buildReferencePath, getModelName } from "../../helpers";
import type { VisitorContext } from "../../types";
import { createErrorResult } from "../errors";
import type { CompositionTraversalResult, TransformResult } from "../types";

/**
 * discriminator定義
 * OpenAPI 3.xのdiscriminatorをサポート
 */
interface DiscriminatorObject {
  propertyName: string;
  mapping?: Record<string, string>;
}

/**
 * oneOfスキーマをIRUnionModelに変換
 *
 * @param schema - oneOfスキーマ
 * @param context - Visitorコンテキスト
 * @param traversalResult - トラバーサルから得られたサブスキーマの型とモデル
 * @returns 変換結果
 *
 * @example OpenAPI YAML - シンプルなoneOf
 * ```yaml
 * Result:
 *   oneOf:
 *     - $ref: '#/components/schemas/Success'
 *     - $ref: '#/components/schemas/Error'
 *   description: "Result union"
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
 */
export function transformOneOf(
  schema: SchemaObject,
  context: VisitorContext,
  traversalResult: CompositionTraversalResult,
): TransformResult {
  const name = getModelName(context);
  const referencePath = buildReferencePath(context.documentPath);

  // トラバーサルが失敗した場合（空配列）
  if (traversalResult.schemas.length === 0) {
    return createErrorResult(
      `Failed to resolve oneOf schemas: ${referencePath}`,
      "FAILED_ONEOF_RESOLUTION",
      { referencePath, context },
    );
  }

  // nullable検出: oneOf: [{...}, {type: 'null'}] パターン
  const hasNullType = traversalResult.schemas.some((type) => type === "null");

  // nullを除外した型配列
  const types = traversalResult.schemas.filter((type) => type !== "null");

  // discriminatorの抽出
  const discriminator = (
    schema as SchemaObject & {
      discriminator?: DiscriminatorObject;
    }
  ).discriminator;

  // IRUnionModelを作成
  const unionModel: IRUnionModel = {
    kind: "union",
    name,
    referencePath,
    types,
    ...(schema.description && { description: schema.description }),
    ...(hasNullType && { nullable: true as const }),
    ...(discriminator && {
      discriminator: {
        propertyName: discriminator.propertyName,
        ...(discriminator.mapping && { mapping: discriminator.mapping }),
      },
    }),
  };

  // unionモデルと子要素から抽出されたモデルを返す
  return {
    type: { kind: "ref", name: referencePath },
    models: [unionModel, ...traversalResult.childModels],
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("transformOneOf", () => {
    it("should create union model with multiple schemas", () => {
      const schema: SchemaObject = {
        oneOf: [
          { $ref: "#/components/schemas/Success" },
          { $ref: "#/components/schemas/Error" },
        ],
        description: "Result union",
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Result"],
        rootSegment: "components",
      };

      const traversalResult: CompositionTraversalResult = {
        schemas: [
          { kind: "ref", name: "#/components/schemas/Success" },
          { kind: "ref", name: "#/components/schemas/Error" },
        ],
        childModels: [],
      };

      const result = transformOneOf(schema, context, traversalResult);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/Result",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0]).toEqual({
        kind: "union",
        name: "Result",
        referencePath: "#/components/schemas/Result",
        types: [
          { kind: "ref", name: "#/components/schemas/Success" },
          { kind: "ref", name: "#/components/schemas/Error" },
        ],
        description: "Result union",
      });
    });

    it("should create union model with discriminator", () => {
      const schema = {
        oneOf: [
          { $ref: "#/components/schemas/Cat" },
          { $ref: "#/components/schemas/Dog" },
        ],
        discriminator: {
          propertyName: "petType",
          mapping: {
            cat: "#/components/schemas/Cat",
            dog: "#/components/schemas/Dog",
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Pet"],
        rootSegment: "components",
      };

      const traversalResult: CompositionTraversalResult = {
        schemas: [
          { kind: "ref", name: "#/components/schemas/Cat" },
          { kind: "ref", name: "#/components/schemas/Dog" },
        ],
        childModels: [],
      };

      const result = transformOneOf(schema, context, traversalResult);

      expect(result.models[0]).toEqual({
        kind: "union",
        name: "Pet",
        referencePath: "#/components/schemas/Pet",
        types: [
          { kind: "ref", name: "#/components/schemas/Cat" },
          { kind: "ref", name: "#/components/schemas/Dog" },
        ],
        discriminator: {
          propertyName: "petType",
          mapping: {
            cat: "#/components/schemas/Cat",
            dog: "#/components/schemas/Dog",
          },
        },
      });
    });

    it("should detect nullable pattern", () => {
      const schema: SchemaObject = {
        oneOf: [{ $ref: "#/components/schemas/User" }, { type: "null" }],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "NullableUser"],
        rootSegment: "components",
      };

      const traversalResult: CompositionTraversalResult = {
        schemas: [{ kind: "ref", name: "#/components/schemas/User" }, "null"],
        childModels: [],
      };

      const result = transformOneOf(schema, context, traversalResult);

      expect(result.models[0]).toEqual({
        kind: "union",
        name: "NullableUser",
        referencePath: "#/components/schemas/NullableUser",
        types: [{ kind: "ref", name: "#/components/schemas/User" }],
        nullable: true,
      });
    });

    it("should return error result when traversal fails", () => {
      const schema: SchemaObject = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        oneOf: [{ type: "invalid" }] as any,
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "FailedOneOf"],
        rootSegment: "components",
      };

      const traversalResult: CompositionTraversalResult = {
        schemas: [], // Empty = all failed
        childModels: [],
      };

      const result = transformOneOf(schema, context, traversalResult);

      expect(result.type).toBeNull();
      expect(result.models).toEqual([]);
      expect(result.error?.code).toBe("FAILED_ONEOF_RESOLUTION");
    });
  });
}
