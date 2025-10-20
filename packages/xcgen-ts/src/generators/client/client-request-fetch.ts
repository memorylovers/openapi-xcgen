/**
 * Fetch実行コード生成
 */

/**
 * Fetch実行のコードを生成
 * @returns Fetch実行のコード
 */
export function generateFetchCode(): string {
  const lines: string[] = [];

  lines.push("  // Make request");
  lines.push("  const fetchFn = config.fetch || fetch;");
  lines.push("  const response = await fetchFn(url, {");
  lines.push("    ...init,");
  lines.push("    method,");
  lines.push("    headers,");
  lines.push(
    "    body: options.body ? JSON.stringify(options.body) : undefined,",
  );
  lines.push("  });");

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("client-request-fetch", () => {
    describe("generateFetchCode", () => {
      it("should generate fetch code", () => {
        const result = generateFetchCode();

        expect(result).toEqual(
          "  // Make request\n" +
            "  const fetchFn = config.fetch || fetch;\n" +
            "  const response = await fetchFn(url, {\n" +
            "    ...init,\n" +
            "    method,\n" +
            "    headers,\n" +
            "    body: options.body ? JSON.stringify(options.body) : undefined,\n" +
            "  });",
        );
      });

      it("should use custom fetch function if available", () => {
        const result = generateFetchCode();

        expect(result).toContain("config.fetch || fetch");
      });

      it("should include body JSON stringification", () => {
        const result = generateFetchCode();

        expect(result).toContain("JSON.stringify(options.body)");
      });
    });
  });
}
