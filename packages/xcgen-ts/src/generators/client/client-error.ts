/**
 * XcgenApiError class生成
 */

/**
 * XcgenApiError classのTypeScriptコードを生成
 * @returns XcgenApiError class定義文字列
 */
export function generateErrorClass(): string {
  const lines: string[] = [];

  lines.push("/**");
  lines.push(" * API error with detailed response information");
  lines.push(" */");
  lines.push("export class XcgenApiError extends Error {");
  lines.push("  readonly response: Response;");
  lines.push("  readonly body?: unknown;");
  lines.push("  readonly status: number;");
  lines.push("  readonly statusText: string;");
  lines.push("  readonly url: string;");
  lines.push("");
  lines.push("  constructor(response: Response, body?: unknown) {");
  lines.push(
    "    super(`API Error: ${response.status} ${response.statusText}`);",
  );
  lines.push('    this.name = "XcgenApiError";');
  lines.push("    this.response = response;");
  lines.push("    this.body = body;");
  lines.push("    this.status = response.status;");
  lines.push("    this.statusText = response.statusText;");
  lines.push("    this.url = response.url;");
  lines.push("  }");
  lines.push("}");

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("client-error", () => {
    describe("generateErrorClass", () => {
      it("should generate XcgenApiError class", () => {
        const result = generateErrorClass();

        expect(result).toContain("export class XcgenApiError extends Error");
        expect(result).toContain("readonly response: Response");
        expect(result).toContain("readonly body?: unknown");
        expect(result).toContain("readonly status: number");
        expect(result).toContain("readonly statusText: string");
        expect(result).toContain("readonly url: string");
      });

      it("should include constructor with response parameter", () => {
        const result = generateErrorClass();

        expect(result).toContain(
          "constructor(response: Response, body?: unknown)",
        );
        expect(result).toContain('this.name = "XcgenApiError"');
      });
    });
  });
}
