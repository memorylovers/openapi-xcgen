/**
 * サービスファイルヘッダー生成
 */

import type { IRMetadata } from "@openapi-xcgen/core";

/**
 * サービスファイルのヘッダーコメントを生成
 * @param metadata - API メタデータ
 * @returns ヘッダーコメント文字列
 */
export function generateServicesHeader(metadata: IRMetadata): string {
  const lines: string[] = [];

  lines.push("/**");
  lines.push(" * API service functions");
  lines.push(` * Generated from: ${metadata.title} ${metadata.version}`);
  lines.push(" * DO NOT EDIT - This file is auto-generated");
  lines.push(" */");

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("services-header", () => {
    describe("generateServicesHeader", () => {
      it("should generate services file header", () => {
        const metadata: IRMetadata = {
          title: "Pet Store API",
          version: "1.0.0",
        };

        const result = generateServicesHeader(metadata);

        expect(result).toEqual(
          `
/**
 * API service functions
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

        const result = generateServicesHeader(metadata);

        expect(result).toContain("Test API 2.0.0");
      });
    });
  });
}
