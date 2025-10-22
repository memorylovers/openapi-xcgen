/**
 * グローバル設定変数生成
 */

/**
 * グローバル設定変数のTypeScriptコードを生成
 * @returns グローバル設定変数定義文字列
 */
export function generateGlobalConfig(): string {
  return "let config: ApiConfig = {};";
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("client-global-config", () => {
    describe("generateGlobalConfig", () => {
      it("should generate global config variable", () => {
        const result = generateGlobalConfig();

        expect(result).toBe("let config: ApiConfig = {};");
      });

      it("should use let keyword for mutability", () => {
        const result = generateGlobalConfig();

        expect(result).toMatch(/^let /);
      });
    });
  });
}
