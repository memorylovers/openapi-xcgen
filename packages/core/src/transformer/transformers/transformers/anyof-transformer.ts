/**
 * AnyOf Transformer - v2 Transformer Architecture
 *
 * anyOfスキーマをIRAnyOfSchemaに変換します。
 * トラバーサル（各サブスキーマ訪問）は composition-traverser に委譲します。
 */

import type { IRAnyOfSchema, SchemaObject } from "../../../types";
import { buildReferencePath, getModelName } from "../../helpers";
import type { VisitorContext } from "../../types";
import { createErrorResult } from "../errors";
import type { CompositionTraversalResult, TransformResult } from "../types";

/**
 * anyOfスキーマをIRAnyOfSchemaに変換
 *
 * @param schema - anyOfスキーマ
 * @param context - Visitorコンテキスト
 * @param traversalResult - トラバーサルから得られたサブスキーマの型とモデル
 * @returns 変換結果
 *
 * @example OpenAPI YAML - シンプルなanyOf
 * ```yaml
 * Value:
 *   anyOf:
 *     - type: string
 *     - type: number
 *   description: "String or number value"
 * ```
 *
 * @example OpenAPI YAML - nullable型パターン（OpenAPI 3.1）
 * ```yaml
 * User:
 *   anyOf:
 *     - $ref: '#/components/schemas/UserObject'
 *     - type: 'null'
 * ```
 */
export function transformAnyOf(
  schema: SchemaObject,
  context: VisitorContext,
  traversalResult: CompositionTraversalResult,
): TransformResult {
  const name = getModelName(context);
  const referencePath = buildReferencePath(context.documentPath);

  // トラバーサルが失敗した場合（空配列）
  if (traversalResult.schemas.length === 0) {
    return createErrorResult(
      `Failed to resolve anyOf schemas: ${referencePath}`,
      "FAILED_ANYOF_RESOLUTION",
      { referencePath, context },
    );
  }

  // nullable検出: anyOf: [{...}, {type: 'null'}] パターン（OpenAPI 3.1）
  const hasNullType = traversalResult.schemas.some((type) => type === "null");

  // nullを除外した型配列
  const schemas = traversalResult.schemas.filter((type) => type !== "null");

  // IRAnyOfSchemaを作成
  const anyOfModel: IRAnyOfSchema = {
    kind: "anyOf",
    name,
    referencePath,
    schemas,
    ...(schema.description && { description: schema.description }),
    ...(hasNullType && { nullable: true as const }),
  };

  // anyOfモデルと子要素から抽出されたモデルを返す
  return {
    type: { kind: "ref", name: referencePath },
    models: [anyOfModel, ...traversalResult.childModels],
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("transformAnyOf", () => {
    it("should create anyOf model with primitive types", () => {
      const schema: SchemaObject = {
        anyOf: [{ type: "string" }, { type: "number" }],
        description: "String or number value",
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Value"],
        rootSegment: "components",
      };

      const traversalResult: CompositionTraversalResult = {
        schemas: ["string", "number"] as CompositionTraversalResult["schemas"],
        childModels: [],
      };

      const result = transformAnyOf(schema, context, traversalResult);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/Value",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0]).toEqual({
        kind: "anyOf",
        name: "Value",
        referencePath: "#/components/schemas/Value",
        schemas: ["string", "number"],
        description: "String or number value",
      });
    });

    it("should create anyOf model with complex types", () => {
      const schema: SchemaObject = {
        anyOf: [
          { $ref: "#/components/schemas/User" },
          { $ref: "#/components/schemas/Admin" },
        ],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Account"],
        rootSegment: "components",
      };

      const traversalResult: CompositionTraversalResult = {
        schemas: [
          { kind: "ref", name: "#/components/schemas/User" },
          { kind: "ref", name: "#/components/schemas/Admin" },
        ],
        childModels: [],
      };

      const result = transformAnyOf(schema, context, traversalResult);

      expect(result.models[0]).toEqual({
        kind: "anyOf",
        name: "Account",
        referencePath: "#/components/schemas/Account",
        schemas: [
          { kind: "ref", name: "#/components/schemas/User" },
          { kind: "ref", name: "#/components/schemas/Admin" },
        ],
      });
    });

    it("should detect nullable pattern (OpenAPI 3.1)", () => {
      const schema: SchemaObject = {
        anyOf: [{ $ref: "#/components/schemas/UserObject" }, { type: "null" }],
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "NullableUser"],
        rootSegment: "components",
      };

      const traversalResult: CompositionTraversalResult = {
        schemas: [
          { kind: "ref", name: "#/components/schemas/UserObject" },
          "null",
        ],
        childModels: [],
      };

      const result = transformAnyOf(schema, context, traversalResult);

      expect(result.models[0]).toEqual({
        kind: "anyOf",
        name: "NullableUser",
        referencePath: "#/components/schemas/NullableUser",
        schemas: [{ kind: "ref", name: "#/components/schemas/UserObject" }],
        nullable: true,
      });
    });

    it("should return error result when traversal fails", () => {
      const schema: SchemaObject = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        anyOf: [{ type: "invalid" }] as any,
      };

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "FailedAnyOf"],
        rootSegment: "components",
      };

      const traversalResult: CompositionTraversalResult = {
        schemas: [], // Empty = all failed
        childModels: [],
      };

      const result = transformAnyOf(schema, context, traversalResult);

      expect(result.type).toBeNull();
      expect(result.models).toEqual([]);
      expect(result.error?.code).toBe("FAILED_ANYOF_RESOLUTION");
    });
  });
}
