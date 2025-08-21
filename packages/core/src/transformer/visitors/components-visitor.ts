/**
 * components-visitor.ts - ComponentsObjectを処理してmodels/enumsに分類
 *
 * OpenAPIのcomponents.schemasセクションを処理し、
 * 各スキーマをIRModel/IREnumに変換して分類する。
 */

import { consola } from "consola";
import type {
  ComponentsObject,
  SchemaObjectWithNullable,
} from "../../types/index.js";
import type { IREnum, IRModel } from "../../types/ir/index.js";
import type { VisitorContext } from "../types.js";
import { visitSchema, type SchemaVisitorContext } from "./schema-visitor.js";

/**
 * Components処理の結果
 */
export interface ComponentsResult {
  /** 抽出されたモデル */
  models: IRModel[];
  /** 抽出されたenum */
  enums: IREnum[];
}

/**
 * ComponentsObjectを処理してmodels/enumsに分類
 *
 * @param components - OpenAPIのComponentsObject
 * @param context - Visitorコンテキスト
 * @returns 分類されたmodels/enums
 *
 * @example OpenAPI YAML
 * ```yaml
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *     Status:
 *       type: string
 *       enum: [pending, approved, rejected]
 * ```
 */
export function visitComponents(
  components: ComponentsObject,
  _context: VisitorContext,
): ComponentsResult {
  const result: ComponentsResult = {
    models: [],
    enums: [],
  };

  // schemasが存在しない場合は早期リターン
  if (!components.schemas) {
    return result;
  }

  // 各スキーマを処理
  for (const [name, schema] of Object.entries(components.schemas)) {
    // null/undefinedチェック
    if (!schema) {
      consola.warn(`Invalid schema for "${name}": schema is null or undefined`);
      continue;
    }

    try {
      // visitSchemaを呼び出し（SchemaVisitorContextを作成）
      const schemaContext: SchemaVisitorContext = { name };
      const schemaResult = visitSchema(
        schema as SchemaObjectWithNullable,
        schemaContext,
      );

      // 結果の各配列をマージ
      result.models.push(...schemaResult.models);
      result.enums.push(...schemaResult.enums);
      // schemaResult.typeは使用しない（componentsレベルでは不要）
    } catch (error) {
      consola.warn(`Failed to process schema "${name}":`, error);
    }
  }

  return result;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;
  const { createContext } = await import("../types.js");

  describe("visitComponents", () => {
    it("should extract models and enums from schemas", () => {
      const components: ComponentsObject = {
        schemas: {
          Item: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["a", "b"] },
            },
          },
          Type: {
            type: "string",
            enum: ["x", "y"],
          },
        },
      };

      const result = visitComponents(components, createContext());

      expect(result).toEqual({
        models: [
          {
            name: "Item",
            properties: [
              {
                name: "status",
                type: { kind: "ref", name: "ItemStatus" },
                required: false,
                validation: { enum: ["a", "b"] },
              },
            ],
          },
        ],
        enums: [
          {
            name: "ItemStatus",
            type: "string",
            values: [
              { value: "a", name: "A" },
              { value: "b", name: "B" },
            ],
          },
          {
            name: "Type",
            type: "string",
            values: [
              { value: "x", name: "X" },
              { value: "y", name: "Y" },
            ],
          },
        ],
      });
    });

    it("should handle empty components.schemas", () => {
      const components: ComponentsObject = { schemas: {} };
      const result = visitComponents(components, createContext());

      expect(result.models).toEqual([]);
      expect(result.enums).toEqual([]);
    });

    it("should handle undefined or missing schemas", () => {
      // schemasプロパティが存在しない場合
      const componentsWithoutSchemas: ComponentsObject = {};
      const result1 = visitComponents(
        componentsWithoutSchemas,
        createContext(),
      );

      expect(result1).toEqual({
        models: [],
        enums: [],
      });

      // schemasプロパティがundefinedの場合
      const componentsWithUndefined: ComponentsObject = {
        schemas: undefined,
      };
      const result2 = visitComponents(componentsWithUndefined, createContext());

      expect(result2).toEqual({
        models: [],
        enums: [],
      });
    });

    it("should warn and skip invalid schemas", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const components: ComponentsObject = {
        schemas: {
          Invalid: null as unknown as SchemaObjectWithNullable,
          Valid: { type: "string", enum: ["a", "b"] },
        },
      };

      const result = visitComponents(components, createContext());

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid schema"),
      );
      expect(result.enums).toHaveLength(1); // Validのenumのみ

      warnSpy.mockRestore();
    });

    it("should handle error in visitSchema gracefully", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      // visitSchemaでエラーを発生させるため、不正な型を渡す
      const components: ComponentsObject = {
        schemas: {
          BadSchema: {
            type: "invalid_type",
          } as unknown as SchemaObjectWithNullable,
          GoodSchema: { type: "string", enum: ["a", "b"] },
        },
      };

      const result = visitComponents(components, createContext());

      // BadSchemaの処理でエラーは出るが、GoodSchemaは正常に処理される
      expect(result).toEqual({
        models: [],
        enums: [
          {
            name: "GoodSchema",
            type: "string",
            values: [
              { value: "a", name: "A" },
              { value: "b", name: "B" },
            ],
          },
        ],
      });

      warnSpy.mockRestore();
    });

    it("should handle array type schemas", () => {
      const components: ComponentsObject = {
        schemas: {
          List: {
            type: "array",
            items: { type: "string" },
          },
        },
      };

      const result = visitComponents(components, createContext());

      // 配列型はモデル/enumとして扱われない
      expect(result).toEqual({
        models: [],
        enums: [],
      });
    });

    it("should handle scalar type schemas", () => {
      const components: ComponentsObject = {
        schemas: {
          Count: { type: "integer" },
        },
      };

      const result = visitComponents(components, createContext());

      // プリミティブ型はモデル/enumとして扱われない
      expect(result).toEqual({
        models: [],
        enums: [],
      });
    });

    it("should handle $ref schemas", () => {
      const components: ComponentsObject = {
        schemas: {
          Ref: {
            $ref: "#/components/schemas/Item",
          } as unknown as SchemaObjectWithNullable,
        },
      };

      const result = visitComponents(components, createContext());

      // $ref参照はモデル/enumとして扱われない
      expect(result).toEqual({
        models: [],
        enums: [],
      });
    });
  });
}
