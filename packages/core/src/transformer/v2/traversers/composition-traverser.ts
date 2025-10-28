/**
 * Composition Traverser - v2 Transformer Architecture
 *
 * Composition型スキーマ（allOf/oneOf/anyOf）の各サブスキーマを訪問し、
 * 各スキーマの型と抽出されたモデルを返します。
 * 変換処理は各composition transformer に委譲します。
 */

import { consola } from "consola";
import type { ReferenceObject, SchemaObjectWithNullable } from "../../../types";
import { buildReferencePath } from "../../helpers";
import type { VisitorContext } from "../../types";
import type { CompositionTraversalResult } from "../types";

/**
 * スキーマ訪問関数の型
 */
type VisitSchemaFn = (
  schema: SchemaObjectWithNullable | ReferenceObject,
  context: VisitorContext,
) => { type: unknown; models: unknown[] };

/**
 * Composition型スキーマ（allOf/oneOf/anyOf）の各サブスキーマを訪問
 *
 * @param schemas - サブスキーマの配列
 * @param context - 親コンテキスト
 * @param visitSchema - スキーマ訪問関数（再帰用）
 * @param compositionType - Compositionの種類（"allOf" | "oneOf" | "anyOf"）
 * @returns Compositionのトラバーサル結果
 */
export function traverseComposition(
  schemas: (SchemaObjectWithNullable | ReferenceObject)[],
  context: VisitorContext,
  visitSchema: VisitSchemaFn,
  compositionType: "allOf" | "oneOf" | "anyOf",
): CompositionTraversalResult {
  // 空配列チェック
  if (!schemas || schemas.length === 0) {
    consola.warn(
      `Empty ${compositionType} array: ${buildReferencePath(context.documentPath)}`,
    );
    return {
      schemas: [],
      childModels: [],
    };
  }

  const visitedTypes: unknown[] = [];
  const allChildModels: unknown[] = [];

  // 各サブスキーマを訪問
  schemas.forEach((subSchema, index) => {
    const subContext: VisitorContext = {
      documentPath: [
        ...context.documentPath.slice(0, -1),
        `${context.documentPath[context.documentPath.length - 1]}${compositionType}${index}`,
      ],
      rootSegment: context.rootSegment,
    };

    const result = visitSchema(subSchema, subContext);

    if (!result.type) {
      const referencePath = buildReferencePath(subContext.documentPath);
      consola.warn(
        `Failed to resolve ${compositionType}[${index}] schema: ${referencePath}`,
      );
      return; // このサブスキーマはスキップ
    }

    visitedTypes.push(result.type);
    allChildModels.push(...result.models);
  });

  // 全てのサブスキーマが失敗した場合
  if (visitedTypes.length === 0) {
    consola.warn(
      `All ${compositionType} schemas failed: ${buildReferencePath(context.documentPath)}`,
    );
    return {
      schemas: [],
      childModels: [],
    };
  }

  return {
    schemas: visitedTypes as CompositionTraversalResult["schemas"],
    childModels: allChildModels as CompositionTraversalResult["childModels"],
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("traverseComposition", () => {
    it("should traverse allOf schemas", () => {
      const mockVisitSchema = vi
        .fn()
        .mockReturnValueOnce({
          type: { kind: "ref", name: "#/components/schemas/Base" },
          models: [
            {
              kind: "object",
              name: "Base",
              referencePath: "#/components/schemas/Base",
              properties: [{ name: "id", type: "string" }],
            },
          ],
        })
        .mockReturnValueOnce({
          type: { kind: "ref", name: "#/components/schemas/Extra" },
          models: [
            {
              kind: "object",
              name: "Extra",
              referencePath: "#/components/schemas/Extra",
              properties: [{ name: "extra", type: "string" }],
            },
          ],
        });

      const schemas = [
        { $ref: "#/components/schemas/Base" },
        { $ref: "#/components/schemas/Extra" },
      ];

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Extended"],
        rootSegment: "components",
      };

      const result = traverseComposition(
        schemas,
        context,
        mockVisitSchema,
        "allOf",
      );

      expect(result.schemas).toHaveLength(2);
      expect(result.schemas[0]).toEqual({
        kind: "ref",
        name: "#/components/schemas/Base",
      });
      expect(result.schemas[1]).toEqual({
        kind: "ref",
        name: "#/components/schemas/Extra",
      });
      expect(result.childModels).toHaveLength(2);
    });

    it("should traverse oneOf schemas", () => {
      const mockVisitSchema = vi
        .fn()
        .mockReturnValueOnce({
          type: "string",
          models: [],
        })
        .mockReturnValueOnce({
          type: "number",
          models: [],
        });

      const schemas = [
        { type: "string" as const },
        { type: "number" as const },
      ];

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "StringOrNumber"],
        rootSegment: "components",
      };

      const result = traverseComposition(
        schemas,
        context,
        mockVisitSchema,
        "oneOf",
      );

      expect(result.schemas).toEqual(["string", "number"]);
      expect(result.childModels).toEqual([]);
    });

    it("should warn for empty composition array", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const mockVisitSchema = vi.fn();

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Empty"],
        rootSegment: "components",
      };

      const result = traverseComposition([], context, mockVisitSchema, "anyOf");

      expect(result.schemas).toEqual([]);
      expect(result.childModels).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        "Empty anyOf array: #/components/schemas/Empty",
      );

      warnSpy.mockRestore();
    });

    it("should skip failed sub-schemas but continue with successful ones", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const mockVisitSchema = vi
        .fn()
        .mockReturnValueOnce({
          type: "string",
          models: [],
        })
        .mockReturnValueOnce({
          type: null, // 失敗
          models: [],
        })
        .mockReturnValueOnce({
          type: "number",
          models: [],
        });

      const schemas = [
        { type: "string" as const },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { type: "invalid" as any },
        { type: "number" as const },
      ];

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Mixed"],
        rootSegment: "components",
      };

      const result = traverseComposition(
        schemas,
        context,
        mockVisitSchema,
        "oneOf",
      );

      expect(result.schemas).toHaveLength(2);
      expect(result.schemas).toEqual(["string", "number"]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to resolve oneOf[1] schema"),
      );

      warnSpy.mockRestore();
    });

    it("should warn when all sub-schemas fail", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: null,
        models: [],
      });

      const schemas = [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { type: "invalid1" } as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { type: "invalid2" } as any,
      ];

      const context: VisitorContext = {
        documentPath: ["components", "schemas", "AllFailed"],
        rootSegment: "components",
      };

      const result = traverseComposition(
        schemas,
        context,
        mockVisitSchema,
        "allOf",
      );

      expect(result.schemas).toEqual([]);
      expect(result.childModels).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        "All allOf schemas failed: #/components/schemas/AllFailed",
      );

      warnSpy.mockRestore();
    });
  });
}
