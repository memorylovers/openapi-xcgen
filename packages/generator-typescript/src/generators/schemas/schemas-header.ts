/**
 * スキーマファイルヘッダー生成
 */

import type { IRMetadata } from "@openapi-xcgen/core";

/**
 * スキーマファイルのヘッダーコメントを生成
 * @param metadata - API メタデータ
 * @returns ヘッダーコメント文字列
 */
export function generateSchemasHeader(metadata: IRMetadata): string {
  const lines: string[] = [];

  lines.push("/**");
  lines.push(" * Valibot validation schemas");
  lines.push(` * Generated from: ${metadata.title} ${metadata.version}`);
  lines.push(" * DO NOT EDIT - This file is auto-generated");
  lines.push(" */");

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("schemas-header", () => {
    describe("generateSchemasHeader", () => {
      it("should generate schemas file header", () => {
        const metadata: IRMetadata = {
          title: "Pet Store API",
          version: "1.0.0",
        };

        const result = generateSchemasHeader(metadata);

        expect(result).toEqual(
          `
/**
 * Valibot validation schemas
 * Generated from: Pet Store API 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */
`.trim(),
        );
      });

      it("should include API title and version", () => {
        const metadata: IRMetadata = {
          title: "Test API",
          version: "2.0.0",
        };

        const result = generateSchemasHeader(metadata);

        expect(result).toContain("Test API 2.0.0");
      });
    });
  });
}
