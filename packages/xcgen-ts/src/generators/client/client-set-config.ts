/**
 * setConfig関数生成
 */

/**
 * setConfig関数のTypeScriptコードを生成
 * @returns setConfig関数定義文字列
 */
export function generateSetConfigFunction(): string {
  const lines: string[] = [];

  lines.push("/**");
  lines.push(" * Configure the API client");
  lines.push(" * @param newConfig - Configuration options");
  lines.push(" */");
  lines.push("export function setConfig(newConfig: ApiConfig): void {");
  lines.push("  config = { ...config, ...newConfig };");
  lines.push("}");

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("client-set-config", () => {
    describe("generateSetConfigFunction", () => {
      it("should generate setConfig function", () => {
        const result = generateSetConfigFunction();

        expect(result).toContain(
          "export function setConfig(newConfig: ApiConfig)",
        );
        expect(result).toContain("config = { ...config, ...newConfig }");
      });

      it("should include JSDoc comments", () => {
        const result = generateSetConfigFunction();

        expect(result).toContain("Configure the API client");
        expect(result).toContain("@param newConfig");
      });
    });
  });
}
