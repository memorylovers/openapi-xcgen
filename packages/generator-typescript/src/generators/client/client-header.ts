/**
 * クライアントファイルヘッダー生成
 */

import type { IRMetadata } from "@openapi-xcgen/core";

/**
 * クライアントファイルのヘッダーコメントを生成
 * @param metadata - API基本情報
 * @returns ヘッダーコメント文字列
 */
export function generateClientHeader(metadata: IRMetadata): string {
  const lines: string[] = [];

  lines.push("/**");
  lines.push(" * HTTP client utilities");
  lines.push(` * Generated from: ${metadata.title} ${metadata.version}`);
  lines.push(" * DO NOT EDIT - This file is auto-generated");
  lines.push(" */");

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("client-header", () => {
    describe("generateClientHeader", () => {
      it("should generate header with metadata", () => {
        const metadata: IRMetadata = {
          title: "Pet Store API",
          version: "1.0.0",
        };

        const result = generateClientHeader(metadata);

        expect(result).toContain("HTTP client utilities");
        expect(result).toContain("Pet Store API 1.0.0");
        expect(result).toContain("DO NOT EDIT");
      });

      it("should include JSDoc comment format", () => {
        const metadata: IRMetadata = {
          title: "Test API",
          version: "2.0.0",
        };

        const result = generateClientHeader(metadata);

        expect(result).toMatch(/^\/\*\*/);
        expect(result).toMatch(/\*\/$/);
      });
    });
  });
}
