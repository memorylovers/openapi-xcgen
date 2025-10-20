/**
 * ヘッダー構築コード生成
 */

/**
 * ヘッダー構築のコードを生成
 * @returns ヘッダー構築のコード
 */
export function generateHeaderBuildingCode(): string {
  const lines: string[] = [];

  lines.push("  // Build headers");
  lines.push("  const headers: Record<string, string> = {");
  lines.push("    ...config.headers,");
  lines.push("    ...options.header,");
  lines.push("    ...(init?.headers as Record<string, string>),");
  lines.push("  };");
  lines.push("");
  lines.push("  // Add Content-Type for body");
  lines.push("  if (options.body && !headers['Content-Type']) {");
  lines.push("    headers['Content-Type'] = 'application/json';");
  lines.push("  }");

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("client-request-headers", () => {
    describe("generateHeaderBuildingCode", () => {
      it("should generate header building code", () => {
        const result = generateHeaderBuildingCode();

        expect(result).toEqual(
          "  // Build headers\n" +
            "  const headers: Record<string, string> = {\n" +
            "    ...config.headers,\n" +
            "    ...options.header,\n" +
            "    ...(init?.headers as Record<string, string>),\n" +
            "  };\n" +
            "\n" +
            "  // Add Content-Type for body\n" +
            "  if (options.body && !headers['Content-Type']) {\n" +
            "    headers['Content-Type'] = 'application/json';\n" +
            "  }",
        );
      });

      it("should include header merging", () => {
        const result = generateHeaderBuildingCode();

        expect(result).toContain("config.headers");
        expect(result).toContain("options.header");
        expect(result).toContain("init?.headers");
      });

      it("should include Content-Type handling", () => {
        const result = generateHeaderBuildingCode();

        expect(result).toContain("Add Content-Type for body");
        expect(result).toContain("application/json");
      });
    });
  });
}
