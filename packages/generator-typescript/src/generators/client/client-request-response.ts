/**
 * レスポンスパースコード生成
 */

/**
 * レスポンスパースのコードを生成（204/Binary/JSON/Text）
 * @returns レスポンスパースのコード
 */
export function generateResponseParseCode(): string {
  const lines: string[] = [];

  lines.push("  // Parse response");
  lines.push(
    "  if (response.status === 204 || response.headers.get('Content-Length') === '0') {",
  );
  lines.push("    return undefined as T;");
  lines.push("  }");
  lines.push("");
  lines.push(
    "  const contentType = response.headers.get('Content-Type') || '';",
  );
  lines.push("");
  lines.push("  // Handle binary responses (images, PDFs, etc.)");
  lines.push("  if (");
  lines.push("    contentType.includes('application/octet-stream') ||");
  lines.push("    contentType.includes('image/') ||");
  lines.push("    contentType.includes('application/pdf') ||");
  lines.push("    contentType.includes('video/') ||");
  lines.push("    contentType.includes('audio/')");
  lines.push("  ) {");
  lines.push("    return response.blob() as T;");
  lines.push("  }");
  lines.push("");
  lines.push("  // Handle JSON responses");
  lines.push("  if (contentType.includes('application/json')) {");
  lines.push("    return response.json();");
  lines.push("  }");
  lines.push("");
  lines.push("  // Default to text");
  lines.push("  return response.text() as T;");
  lines.push("}");

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("client-request-response", () => {
    describe("generateResponseParseCode", () => {
      it("should generate response parse code", () => {
        const result = generateResponseParseCode();

        expect(result).toEqual(
          "  // Parse response\n" +
            "  if (response.status === 204 || response.headers.get('Content-Length') === '0') {\n" +
            "    return undefined as T;\n" +
            "  }\n" +
            "\n" +
            "  const contentType = response.headers.get('Content-Type') || '';\n" +
            "\n" +
            "  // Handle binary responses (images, PDFs, etc.)\n" +
            "  if (\n" +
            "    contentType.includes('application/octet-stream') ||\n" +
            "    contentType.includes('image/') ||\n" +
            "    contentType.includes('application/pdf') ||\n" +
            "    contentType.includes('video/') ||\n" +
            "    contentType.includes('audio/')\n" +
            "  ) {\n" +
            "    return response.blob() as T;\n" +
            "  }\n" +
            "\n" +
            "  // Handle JSON responses\n" +
            "  if (contentType.includes('application/json')) {\n" +
            "    return response.json();\n" +
            "  }\n" +
            "\n" +
            "  // Default to text\n" +
            "  return response.text() as T;\n" +
            "}",
        );
      });

      it("should handle 204 No Content", () => {
        const result = generateResponseParseCode();

        expect(result).toContain("response.status === 204");
        expect(result).toContain("return undefined as T");
      });

      it("should handle binary content types", () => {
        const result = generateResponseParseCode();

        expect(result).toContain("Handle binary responses");
        expect(result).toContain("application/octet-stream");
        expect(result).toContain("image/");
        expect(result).toContain("application/pdf");
        expect(result).toContain("response.blob()");
      });

      it("should handle JSON content type", () => {
        const result = generateResponseParseCode();

        expect(result).toContain("Handle JSON responses");
        expect(result).toContain("application/json");
        expect(result).toContain("response.json()");
      });

      it("should default to text", () => {
        const result = generateResponseParseCode();

        expect(result).toContain("Default to text");
        expect(result).toContain("response.text()");
      });

      it("should include closing brace", () => {
        const result = generateResponseParseCode();

        expect(result).toMatch(/}\s*$/);
      });
    });
  });
}
