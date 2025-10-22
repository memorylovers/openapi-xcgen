/**
 * request関数シグネチャ生成
 */

/**
 * request関数のシグネチャと開始部分を生成
 * @returns request関数のシグネチャコード
 */
export function generateRequestSignature(): string {
  const lines: string[] = [];

  lines.push("/**");
  lines.push(" * Internal request helper");
  lines.push(" * @internal");
  lines.push(" */");
  lines.push("export async function request<T>(params: {");
  lines.push("  method: string;");
  lines.push("  path: string;");
  lines.push("  options: any;");
  lines.push("  init?: RequestInit;");
  lines.push("}): Promise<T> {");
  lines.push("  const { method, path, options, init } = params;");

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("client-request-signature", () => {
    describe("generateRequestSignature", () => {
      it("should generate request function signature", () => {
        const result = generateRequestSignature();

        expect(result).toEqual(
          `
/**
 * Internal request helper
 * @internal
 */
export async function request<T>(params: {
  method: string;
  path: string;
  options: any;
  init?: RequestInit;
}): Promise<T> {
  const { method, path, options, init } = params;
`.trim(),
        );
      });

      it("should include JSDoc comments", () => {
        const result = generateRequestSignature();

        expect(result).toContain("Internal request helper");
        expect(result).toContain("@internal");
      });

      it("should include parameter destructuring", () => {
        const result = generateRequestSignature();

        expect(result).toContain(
          "const { method, path, options, init } = params;",
        );
      });
    });
  });
}
