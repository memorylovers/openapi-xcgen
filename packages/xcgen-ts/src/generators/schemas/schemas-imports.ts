/**
 * スキーマファイルimport文生成
 */

/**
 * スキーマファイルのimport文を生成
 * @returns import文字列
 */
export function generateSchemasImports(): string {
  return `import * as v from "valibot";`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("schemas-imports", () => {
    describe("generateSchemasImports", () => {
      it("should generate valibot import", () => {
        const result = generateSchemasImports();

        expect(result).toEqual(`import * as v from "valibot";`);
      });
    });
  });
}
