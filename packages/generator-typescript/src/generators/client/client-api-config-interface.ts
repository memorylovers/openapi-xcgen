/**
 * ApiConfig interface生成
 */

/**
 * ApiConfig interfaceのTypeScriptコードを生成
 * @returns ApiConfig interface定義文字列
 */
export function generateApiConfigInterface(): string {
  const lines: string[] = [];

  lines.push("/**");
  lines.push(" * API client configuration");
  lines.push(" */");
  lines.push("export interface ApiConfig {");
  lines.push("  /** Base URL for all API requests */");
  lines.push("  baseUrl?: string;");
  lines.push("  /** Default headers for all requests */");
  lines.push("  headers?: Record<string, string>;");
  lines.push("  /** Custom fetch function (for interceptors) */");
  lines.push("  fetch?: typeof fetch;");
  lines.push("}");

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("client-api-config-interface", () => {
    describe("generateApiConfigInterface", () => {
      it("should generate ApiConfig interface", () => {
        const result = generateApiConfigInterface();

        expect(result).toContain("export interface ApiConfig");
        expect(result).toContain("baseUrl?: string");
        expect(result).toContain("headers?: Record<string, string>");
        expect(result).toContain("fetch?: typeof fetch");
      });

      it("should include JSDoc comment", () => {
        const result = generateApiConfigInterface();

        expect(result).toContain("API client configuration");
      });
    });
  });
}
