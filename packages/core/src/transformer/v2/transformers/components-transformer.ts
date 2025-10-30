/**
 * components-transformer.ts - ComponentsObjectを処理してmodels/securitySchemes等に分類
 *
 * 責務:
 * - components.schemasの処理（dispatchSchemaに委譲）
 * - components.securitySchemesの処理
 * - components.responsesの処理
 * - components.requestBodiesの処理
 */

import { consola } from "consola";
import { buildComponentSchemaPath } from "../../helpers";
import type {
  ComponentsObject,
  IRModel,
  IRRequestBody,
  IRResponse,
  IRSecurityScheme,
  SchemaObjectWithNullable,
} from "../../../types";
import type { TransformContext } from "../context";
import { dispatchSchema } from "../dispatchers/schema-dispatcher";
import { transformSecuritySchemes } from "./security-schemes-transformer";

/**
 * Components処理の結果
 */
export interface ComponentsTransformResult {
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
 * ComponentsObjectを処理してモデル/セキュリティスキーム等に変換
 *
 * @param components - OpenAPIのComponentsObject
 * @param context - 変換コンテキスト
 * @returns 統一されたモデル配列とセキュリティスキーム等
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
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 * ```
 */
export function transformComponents(
  components: ComponentsObject,
  context: TransformContext,
): ComponentsTransformResult {
  const result: ComponentsTransformResult = {
    models: [],
  };

  // securitySchemesを処理
  if (components.securitySchemes) {
    const securitySchemes = transformSecuritySchemes(
      components.securitySchemes,
    );
    if (Object.keys(securitySchemes).length > 0) {
      result.securitySchemes = securitySchemes;
    }
  }

  // Note: responses と requestBodies は現時点では処理しない
  // これらは古い実装でも未実装でした

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
      // dispatchSchemaを呼び出し
      const schemaContext: TransformContext = {
        documentPath: buildComponentSchemaPath(context, name),
        rootSegment: "components",
      };
      const schemaResult = dispatchSchema(
        schema as SchemaObjectWithNullable,
        schemaContext,
      );

      // 結果をマージ（統一されたモデル配列）
      result.models.push(...schemaResult.models);
    } catch (error) {
      consola.warn(`Failed to process schema "${name}":`, error);
    }
  }

  return result;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("transformComponents", () => {
    it("should extract models from schemas", () => {
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

      const result = transformComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      expect(result.models).toHaveLength(3); // Item object + 2 enums
      expect(result.models[0].kind).toBe("object");
      expect(result.models[0].name).toBe("Item");
      expect(result.models[1].kind).toBe("enum");
      expect(result.models[2].kind).toBe("enum");
    });

    it("should handle empty components.schemas", () => {
      const components: ComponentsObject = { schemas: {} };
      const result = transformComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      expect(result.models).toEqual([]);
    });

    it("should handle null or missing schemas", () => {
      const componentsWithoutSchemas: ComponentsObject = {};
      const result = transformComponents(componentsWithoutSchemas, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      expect(result).toEqual({
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

      const result = transformComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid schema"),
      );
      expect(result.models.length).toEqual(1); // Valid enum only

      warnSpy.mockRestore();
    });

    it("should process securitySchemes", () => {
      const components: ComponentsObject = {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
          ApiKey: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key",
          },
        },
      };

      const result = transformComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      expect(result.securitySchemes).toEqual({
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        ApiKey: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
      });
    });

    it("should handle error in dispatchSchema gracefully", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const components: ComponentsObject = {
        schemas: {
          BadSchema: {
            type: "invalid_type",
          } as unknown as SchemaObjectWithNullable,
          GoodSchema: { type: "string", enum: ["a", "b"] },
        },
      };

      const result = transformComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      // GoodSchemaは正常に処理される
      expect(result.models.length).toBeGreaterThan(0);

      warnSpy.mockRestore();
    });
  });
}
