/**
 * components-visitor.ts - ComponentsObjectを処理してmodels/enumsに分類
 *
 * OpenAPIのcomponents.schemasセクションを処理し、
 * 各スキーマをIRModel/IREnumに変換して分類する。
 */

import { consola } from "consola";
import type {
  ComponentsObject,
  IRModel,
  IRRequestBody,
  IRResponse,
  IRSecurityScheme,
  SchemaObjectWithNullable,
} from "../../../types";
import type { SchemaContext, VisitorContext } from "../../types";
import { visitSchema } from "../schema/schema-visitor";
import { visitComponentsRequestBodies } from "./requestBodies-components-visitor";
import { visitComponentsResponses } from "./responses-components-visitor";
import { visitSecuritySchemes } from "./security-schemes-visitor";

/**
 * Components処理の結果
 */
export interface ComponentsResult {
  /** 抽出されたモデル（オブジェクト、列挙型、配列、マップを統一的に管理） */
  models: IRModel[];
  /** セキュリティスキーム定義 */
  securitySchemes?: Record<string, IRSecurityScheme>;
  /** 共通レスポンス定義 */
  responses?: Record<string, IRResponse>;
  /** 共通リクエストボディ定義 */
  requestBodies?: Record<string, IRRequestBody>;
}

/**
 * ComponentsObjectを処理してモデルに変換
 *
 * @param components - OpenAPIのComponentsObject
 * @param context - Visitorコンテキスト
 * @returns 統一されたモデル配列
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
  context: VisitorContext,
): ComponentsResult {
  const result: ComponentsResult = {
    models: [],
  };

  // securitySchemesを処理
  if (components.securitySchemes) {
    const securitySchemes = visitSecuritySchemes(components.securitySchemes);
    if (Object.keys(securitySchemes).length > 0) {
      result.securitySchemes = securitySchemes;
    }
  }

  // responsesを処理
  if (components.responses) {
    const responses = visitComponentsResponses(components.responses);
    if (Object.keys(responses).length > 0) {
      result.responses = responses;
    }
  }

  // requestBodiesを処理
  if (components.requestBodies) {
    const requestBodies = visitComponentsRequestBodies(
      components.requestBodies,
    );
    if (Object.keys(requestBodies).length > 0) {
      result.requestBodies = requestBodies;
    }
  }

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
      // visitSchemaを呼び出し（SchemaContextを作成）
      const schemaContext: SchemaContext = {
        documentPath: [...context.documentPath, "schemas", name],
        schemaName: name,
        rootSegment: "components",
      };
      const schemaResult = visitSchema(
        schema as SchemaObjectWithNullable,
        schemaContext,
      );

      // 結果をマージ（統一されたモデル配列）
      result.models.push(...schemaResult.models);
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

      const result = visitComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [
          {
            kind: "object",
            name: "Item",
            referencePath: "#/components/schemas/Item",
            properties: [
              {
                name: "status",
                type: { kind: "ref", name: "#/components/schemas/ItemStatus" },
              },
            ],
          },
          {
            kind: "enum",
            name: "ItemStatus",
            referencePath: "#/components/schemas/ItemStatus",
            type: "string",
            values: [
              { value: "a", name: "A" },
              { value: "b", name: "B" },
            ],
          },
          {
            kind: "enum",
            name: "Type",
            referencePath: "#/components/schemas/Type",
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
      const result = visitComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      expect(result.models).toEqual([]);
    });

    it("should handle null or missing schemas", () => {
      // schemasプロパティが存在しない場合
      const componentsWithoutSchemas: ComponentsObject = {};
      const result1 = visitComponents(componentsWithoutSchemas, {
        documentPath: ["components", "schemas"],
        rootSegment: "components",
      });

      expect(result1).toEqual({
        models: [],
      });

      // schemasプロパティが未定義の場合
      const componentsWithNull: ComponentsObject = {
        // schemasは未定義
      };
      const result2 = visitComponents(componentsWithNull, {
        documentPath: ["components", "schemas"],
        rootSegment: "components",
      });

      expect(result2).toEqual({
        models: [],
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

      const result = visitComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid schema"),
      );
      expect(result.models.length).toEqual(1); // Validのenumのみ

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

      const result = visitComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      // BadSchemaの処理でエラーは出るが、GoodSchemaは正常に処理される
      expect(result).toEqual({
        models: [
          {
            kind: "enum",
            name: "GoodSchema",
            referencePath: "#/components/schemas/GoodSchema",
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

      const result = visitComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [
          {
            kind: "array",
            name: "List",
            referencePath: "#/components/schemas/List",
            itemType: "string",
          },
        ],
      });
    });

    it("should handle scalar type schemas", () => {
      const components: ComponentsObject = {
        schemas: {
          Count: { type: "integer" },
        },
      };

      const result = visitComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      // プリミティブ型はモデル/enumとして扱われない
      expect(result).toEqual({
        models: [],
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

      const result = visitComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      // $ref参照はモデル/enumとして扱われない
      expect(result).toEqual({
        models: [],
      });
    });
  });
}
