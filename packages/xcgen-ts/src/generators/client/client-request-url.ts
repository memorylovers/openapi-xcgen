/**
 * URL構築コード生成
 */

/**
 * URL構築のコードを生成（baseUrl + path params + query params）
 * @returns URL構築のコード
 */
export function generateUrlBuildingCode(): string {
  const lines: string[] = [];

  lines.push("  // Build URL with path parameters");
  lines.push("  let url = config.baseUrl ? `${config.baseUrl}${path}` : path;");
  lines.push("");
  lines.push("  // Replace path parameters");
  lines.push("  if (options.path) {");
  lines.push("    for (const [key, value] of Object.entries(options.path)) {");
  lines.push(
    "      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));",
  );
  lines.push("    }");
  lines.push("  }");
  lines.push("");
  lines.push("  // Add query parameters");
  lines.push("  if (options.query) {");
  lines.push("    const params = new URLSearchParams();");
  lines.push("    for (const [key, value] of Object.entries(options.query)) {");
  lines.push("      if (value !== undefined) {");
  lines.push("        params.append(key, String(value));");
  lines.push("      }");
  lines.push("    }");
  lines.push("    const queryString = params.toString();");
  lines.push("    if (queryString) {");
  lines.push("      url += `?${queryString}`;");
  lines.push("    }");
  lines.push("  }");

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("client-request-url", () => {
    describe("generateUrlBuildingCode", () => {
      it("should generate URL building code", () => {
        const result = generateUrlBuildingCode();

        expect(result).toEqual(
          "  // Build URL with path parameters\n" +
            "  let url = config.baseUrl ? `${config.baseUrl}${path}` : path;\n" +
            "\n" +
            "  // Replace path parameters\n" +
            "  if (options.path) {\n" +
            "    for (const [key, value] of Object.entries(options.path)) {\n" +
            "      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));\n" +
            "    }\n" +
            "  }\n" +
            "\n" +
            "  // Add query parameters\n" +
            "  if (options.query) {\n" +
            "    const params = new URLSearchParams();\n" +
            "    for (const [key, value] of Object.entries(options.query)) {\n" +
            "      if (value !== undefined) {\n" +
            "        params.append(key, String(value));\n" +
            "      }\n" +
            "    }\n" +
            "    const queryString = params.toString();\n" +
            "    if (queryString) {\n" +
            "      url += `?${queryString}`;\n" +
            "    }\n" +
            "  }",
        );
      });

      it("should include baseUrl handling", () => {
        const result = generateUrlBuildingCode();

        expect(result).toContain("config.baseUrl");
      });

      it("should include path parameter replacement", () => {
        const result = generateUrlBuildingCode();

        expect(result).toContain("Replace path parameters");
        expect(result).toContain("url.replace");
        expect(result).toContain("encodeURIComponent");
      });

      it("should include query parameter handling", () => {
        const result = generateUrlBuildingCode();

        expect(result).toContain("Add query parameters");
        expect(result).toContain("URLSearchParams");
        expect(result).toContain("params.append");
      });
    });
  });
}
