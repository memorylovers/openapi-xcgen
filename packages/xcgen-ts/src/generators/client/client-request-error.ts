/**
 * エラーハンドリングコード生成
 */

/**
 * エラーハンドリングのコードを生成
 * @returns エラーハンドリングのコード
 */
export function generateErrorHandlingCode(): string {
  const lines: string[] = [];

  lines.push("  // Handle errors");
  lines.push("  if (!response.ok) {");
  lines.push("    let errorBody: unknown;");
  lines.push("    try {");
  lines.push("      errorBody = await response.json();");
  lines.push("    } catch {");
  lines.push("      errorBody = await response.text();");
  lines.push("    }");
  lines.push("    throw new XcgenApiError(response, errorBody);");
  lines.push("  }");

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("client-request-error", () => {
    describe("generateErrorHandlingCode", () => {
      it("should generate error handling code", () => {
        const result = generateErrorHandlingCode();

        expect(result).toEqual(
          "  // Handle errors\n" +
            "  if (!response.ok) {\n" +
            "    let errorBody: unknown;\n" +
            "    try {\n" +
            "      errorBody = await response.json();\n" +
            "    } catch {\n" +
            "      errorBody = await response.text();\n" +
            "    }\n" +
            "    throw new XcgenApiError(response, errorBody);\n" +
            "  }",
        );
      });

      it("should check response.ok status", () => {
        const result = generateErrorHandlingCode();

        expect(result).toContain("if (!response.ok)");
      });

      it("should parse error body as JSON or text", () => {
        const result = generateErrorHandlingCode();

        expect(result).toContain("await response.json()");
        expect(result).toContain("await response.text()");
      });

      it("should throw XcgenApiError", () => {
        const result = generateErrorHandlingCode();

        expect(result).toContain(
          "throw new XcgenApiError(response, errorBody)",
        );
      });
    });
  });
}
