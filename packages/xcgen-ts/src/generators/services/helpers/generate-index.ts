/**
 * services/index.ts 生成
 *
 * 全サービスファイルを再エクスポートするindex.tsファイルの生成
 */

import { kebabCase } from "es-toolkit";

/**
 * 純粋関数: タグ配列 → services/index.ts コード
 *
 * @param tags - タグ名配列
 * @returns index.tsのコード
 *
 * @example
 * ```typescript
 * const tags = ["pets", "users", "Default"];
 * generateServicesIndex(tags);
 * // => "/**\n * API service functions\n * ...\n *\/\n\nexport * from './pets';\nexport * from './users';\nexport * from './default';"
 * ```
 */
export function generateServicesIndex(tags: string[]): string {
  const lines: string[] = [];
  lines.push("/**");
  lines.push(" * API service functions");
  lines.push(" * Auto-generated from OpenAPI specification");
  lines.push(" */");
  lines.push("");

  for (const tag of tags) {
    const filename = kebabCase(tag);
    lines.push(`export * from './${filename}';`);
  }

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("generateServicesIndex", () => {
    it("should generate index file with exports", () => {
      const tags = ["pets", "users"];

      const result = generateServicesIndex(tags);

      expect(result).toContain("/**");
      expect(result).toContain(" * API service functions");
      expect(result).toContain(" * Auto-generated from OpenAPI specification");
      expect(result).toContain(" */");
      expect(result).toContain("export * from './pets';");
      expect(result).toContain("export * from './users';");
    });

    it("should convert tags to kebab-case", () => {
      const tags = ["PetStore", "UserProfile"];

      const result = generateServicesIndex(tags);

      expect(result).toContain("export * from './pet-store';");
      expect(result).toContain("export * from './user-profile';");
    });

    it("should handle default tag", () => {
      const tags = ["default"];

      const result = generateServicesIndex(tags);

      expect(result).toContain("export * from './default';");
    });

    it("should generate empty exports for empty tags array", () => {
      const tags: string[] = [];

      const result = generateServicesIndex(tags);

      expect(result).toContain("/**");
      expect(result).toContain(" * API service functions");
      expect(result).not.toContain("export *");
    });

    it("should preserve tag order", () => {
      const tags = ["zebra", "apple", "mango"];

      const result = generateServicesIndex(tags);

      const lines = result.split("\n");
      const exportLines = lines.filter((line) => line.startsWith("export"));

      expect(exportLines[0]).toContain("zebra");
      expect(exportLines[1]).toContain("apple");
      expect(exportLines[2]).toContain("mango");
    });

    it("should handle tags with special characters", () => {
      const tags = ["API_Endpoints", "HTTP Client"];

      const result = generateServicesIndex(tags);

      expect(result).toContain("export * from './api-endpoints';");
      expect(result).toContain("export * from './http-client';");
    });
  });
}
