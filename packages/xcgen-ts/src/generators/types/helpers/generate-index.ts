/**
 * models/index.ts 生成
 *
 * 全モデルを再エクスポートするindex.tsファイルの生成
 */

import type { IRComponent } from "@openapi-xcgen/core";
import { toTypeName } from "../../../helpers/naming";

/**
 * 純粋関数: IRComponent[] → models/index.ts コード
 *
 * @param models - IRComponent配列
 * @returns index.tsのコード
 *
 * @example
 * ```typescript
 * const models: IRComponent[] = [
 *   { kind: "object", name: "User", ... },
 *   { kind: "object", name: "Product", ... }
 * ];
 * generateModelsIndex(models);
 * // => "/**\n * Model type definitions\n * ...\n *\/\n\nexport * from './User';\nexport * from './Product';"
 * ```
 */
export function generateModelsIndex(models: IRComponent[]): string {
  const lines: string[] = [];
  lines.push("/**");
  lines.push(" * Model type definitions");
  lines.push(" * Auto-generated from OpenAPI specification");
  lines.push(" */");
  lines.push("");

  for (const model of models) {
    lines.push(`export * from './${toTypeName(model.name)}';`);
  }

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("generateModelsIndex", () => {
    it("should generate index file with exports", () => {
      const models: IRComponent[] = [
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

      const result = generateModelsIndex(models);

      expect(result).toContain("/**");
      expect(result).toContain(" * Model type definitions");
      expect(result).toContain(" * Auto-generated from OpenAPI specification");
      expect(result).toContain(" */");
      expect(result).toContain("export * from './User';");
      expect(result).toContain("export * from './Product';");
    });

    it("should generate empty exports for empty models array", () => {
      const models: IRComponent[] = [];

      const result = generateModelsIndex(models);

      expect(result).toContain("/**");
      expect(result).toContain(" * Model type definitions");
      expect(result).not.toContain("export *");
    });

    it("should preserve model order", () => {
      const models: IRComponent[] = [
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

      const result = generateModelsIndex(models);

      const lines = result.split("\n");
      const exportLines = lines.filter((line) => line.startsWith("export"));

      expect(exportLines[0]).toContain("Zebra");
      expect(exportLines[1]).toContain("Apple");
      expect(exportLines[2]).toContain("Mango");
    });

    it("should handle special characters in model names", () => {
      const models: IRComponent[] = [
        {
          kind: "object",
          name: "User_Profile",
          referencePath: "#/components/schemas/User_Profile",
          properties: [],
        },
      ];

      const result = generateModelsIndex(models);

      expect(result).toContain("export * from './UserProfile';");
    });
  });
}
