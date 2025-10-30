/**
 * schemas/index.ts 生成
 *
 * 全スキーマを再エクスポートするindex.tsファイルの生成
 */

import type { IRModel } from "@openapi-xcgen/core";
import { toTypeName } from "../../../helpers/naming";

/**
 * 純粋関数: IRModel[] → schemas/index.ts コード
 *
 * parameterモデルはスキーマを生成しないため除外される。
 *
 * @param models - IRModel配列
 * @returns index.tsのコード
 *
 * @example
 * ```typescript
 * const models: IRModel[] = [
 *   { kind: "object", name: "User", ... },
 *   { kind: "parameter", name: "GetUserParams", ... }  // 除外される
 * ];
 * generateSchemasIndex(models);
 * // => "/**\n * Valibot validation schemas\n * ...\n *\/\n\nexport * from './UserSchema';"
 * ```
 */
export function generateSchemasIndex(models: IRModel[]): string {
  const lines: string[] = [];
  lines.push("/**");
  lines.push(" * Valibot validation schemas");
  lines.push(" * Auto-generated from OpenAPI specification");
  lines.push(" */");
  lines.push("");

  // parameterモデルはスキーマを生成しないため除外
  for (const model of models) {
    if (model.kind !== "parameter") {
      lines.push(`export * from './${toTypeName(model.name)}Schema';`);
    }
  }

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("generateSchemasIndex", () => {
    it("should generate index file with exports", () => {
      const models: IRModel[] = [
        {
          kind: "object",
          name: "User",
          referencePath: "#/components/schemas/User",
          properties: [],
        },
        {
          kind: "object",
          name: "Product",
          referencePath: "#/components/schemas/Product",
          properties: [],
        },
      ];

      const result = generateSchemasIndex(models);

      expect(result).toContain("/**");
      expect(result).toContain(" * Valibot validation schemas");
      expect(result).toContain(" * Auto-generated from OpenAPI specification");
      expect(result).toContain(" */");
      expect(result).toContain("export * from './UserSchema';");
      expect(result).toContain("export * from './ProductSchema';");
    });

    it("should exclude parameter models", () => {
      const models: IRModel[] = [
        {
          kind: "object",
          name: "User",
          referencePath: "#/components/schemas/User",
          properties: [],
        },
        {
          kind: "parameter",
          name: "GetUserParams",
          referencePath: "#/paths/~1users~1{userId}/get/parameters",
          properties: [
            {
              name: "userId",
              type: "string",
              required: true,
              in: "path",
            },
          ],
        },
      ];

      const result = generateSchemasIndex(models);

      expect(result).toContain("export * from './UserSchema';");
      expect(result).not.toContain("GetUserParams");
      expect(result).not.toContain("ParameterSchema");
    });

    it("should generate empty exports for empty models array", () => {
      const models: IRModel[] = [];

      const result = generateSchemasIndex(models);

      expect(result).toContain("/**");
      expect(result).toContain(" * Valibot validation schemas");
      expect(result).not.toContain("export *");
    });

    it("should preserve model order", () => {
      const models: IRModel[] = [
        {
          kind: "object",
          name: "Zebra",
          referencePath: "#/components/schemas/Zebra",
          properties: [],
        },
        {
          kind: "object",
          name: "Apple",
          referencePath: "#/components/schemas/Apple",
          properties: [],
        },
        {
          kind: "object",
          name: "Mango",
          referencePath: "#/components/schemas/Mango",
          properties: [],
        },
      ];

      const result = generateSchemasIndex(models);

      const lines = result.split("\n");
      const exportLines = lines.filter((line) => line.startsWith("export"));

      expect(exportLines[0]).toContain("ZebraSchema");
      expect(exportLines[1]).toContain("AppleSchema");
      expect(exportLines[2]).toContain("MangoSchema");
    });

    it("should handle mixed model types", () => {
      const models: IRModel[] = [
        {
          kind: "object",
          name: "User",
          referencePath: "#/components/schemas/User",
          properties: [],
        },
        {
          kind: "enum",
          name: "Status",
          referencePath: "#/components/schemas/Status",
          type: "string",
          values: [{ value: "active", name: "ACTIVE" }],
        },
        {
          kind: "parameter",
          name: "GetUserParams",
          referencePath: "#/paths/~1users/get/parameters",
          properties: [],
        },
      ];

      const result = generateSchemasIndex(models);

      expect(result).toContain("export * from './UserSchema';");
      expect(result).toContain("export * from './StatusSchema';");
      expect(result).not.toContain("GetUserParams");
    });
  });
}
