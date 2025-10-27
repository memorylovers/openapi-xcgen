/**
 * additionalPropertiesをIRTypeに変換するヘルパー関数
 */

import { consola } from "consola";
import type {
  IRModel,
  IRType,
  ReferenceObject,
  SchemaObject,
  SchemaObjectWithNullable,
} from "../../../types";
import {
  buildAdditionalPropertiesModelName,
  getModelName,
} from "../../helpers";
import type { AdditionalPropertiesContext, VisitorContext } from "../../types";
import { visitSchema } from "./schema-visitor";

/**
 * additionalProperties処理の結果
 */
export interface AdditionalPropertiesResult {
  /** additionalPropertiesの型 */
  type: IRType | null;
  /** 抽出されたモデル（配列型の場合など） */
  models: IRModel[];
}

/**
 * additionalPropertiesをIRTypeに変換
 *
 * @param additionalProperties - OpenAPIのadditionalProperties値
 * @param context - Visitorコンテキスト
 * @returns AdditionalPropertiesResult型の結果
 *
 * @example
 * ```yaml
 * # プリミティブ型
 * additionalProperties:
 *   type: string
 *
 * # 参照型
 * additionalProperties:
 *   $ref: '#/components/schemas/MetadataValue'
 *
 * # 配列型
 * additionalProperties:
 *   type: array
 *   items:
 *     type: string
 *
 * # boolean値
 * additionalProperties: true  # any型として扱う
 * additionalProperties: false # 追加プロパティ禁止
 * ```
 */
export function visitAdditionalProperties(
  additionalProperties: SchemaObject | ReferenceObject | boolean,
  context: VisitorContext,
): AdditionalPropertiesResult {
  // boolean値の処理
  if (typeof additionalProperties === "boolean") {
    if (additionalProperties === true) {
      consola.warn(
        "additionalProperties: true (any type) is not supported; specify a schema for map values",
      );
    }
    return { type: null, models: [] };
  }

  // SchemaObject | ReferenceObjectの処理
  // visitSchemaを使って通常の型変換処理を行う（すべての型をサポート）
  const schemaObj = additionalProperties as SchemaObjectWithNullable;

  // 親モデル名を取得してadditionalPropertiesモデル名を生成
  const parentName = getModelName(context);
  const inlineModelName = buildAdditionalPropertiesModelName(parentName);

  // additionalProperties専用のコンテキストを構築
  const inlineContext: AdditionalPropertiesContext = {
    kind: "additionalProperties",
    documentPath: [...context.documentPath.slice(0, -1), inlineModelName],
    rootSegment: context.rootSegment,
  };

  const result = visitSchema(schemaObj, inlineContext);

  if (!result.type) {
    consola.warn(`Failed to convert additionalProperties to IRType`);
  }

  return { type: result.type, models: result.models };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitAdditionalProperties", () => {
    it("should convert primitive type", () => {
      const schema: SchemaObjectWithNullable = {
        type: "string",
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Test"],
        rootSegment: "components",
      };

      const result = visitAdditionalProperties(schema, context);
      expect(result).toEqual({
        type: "string",
        models: [],
      });
    });

    it("should convert array type and extract model", () => {
      const schema: SchemaObjectWithNullable = {
        type: "array",
        items: { type: "string" },
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Test"],
        rootSegment: "components",
      };

      const result = visitAdditionalProperties(schema, context);
      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/TestItem",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0]).toEqual({
        kind: "array",
        name: "TestItem",
        referencePath: "#/components/schemas/TestItem",
        itemType: "string",
      });
    });

    it("should convert reference type", () => {
      const schema: ReferenceObject = {
        $ref: "#/components/schemas/MetadataValue",
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Test"],
        rootSegment: "components",
      };

      const result = visitAdditionalProperties(schema, context);
      expect(result).toEqual({
        type: {
          kind: "ref",
          name: "#/components/schemas/MetadataValue",
        },
        models: [],
      });
    });

    it("should handle boolean false", () => {
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Test"],
        rootSegment: "components",
      };

      const result = visitAdditionalProperties(false, context);
      expect(result).toEqual({
        type: null,
        models: [],
      });
    });

    it("should warn and return null for boolean true", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Test"],
        rootSegment: "components",
      };

      const result = visitAdditionalProperties(true, context);
      expect(result).toEqual({
        type: null,
        models: [],
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "additionalProperties: true (any type) is not supported; specify a schema for map values",
      );
      warnSpy.mockRestore();
    });
  });
}
