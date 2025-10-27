/**
 * Import文の処理ヘルパー
 *
 * Hook から追加される import を型名と完全import文に分離処理する
 */

/**
 * 文字列が完全なimport文かどうかを判定
 *
 * @param str - チェックする文字列
 * @returns 完全なimport文の場合true
 *
 * @example
 * ```typescript
 * isFullImportStatement("import { foo } from 'bar'") // => true
 * isFullImportStatement("UserId") // => false
 * ```
 */
export function isFullImportStatement(str: string): boolean {
  return str.trim().startsWith("import ");
}

/**
 * import配列を型名と完全import文に分離
 *
 * @param imports - import配列（型名または完全import文）
 * @returns 分離されたimport
 *
 * @example
 * ```typescript
 * const imports = [
 *   "UserId",
 *   "import { validators } from '@/lib'",
 *   "EmailAddress"
 * ];
 *
 * const result = processImports(imports);
 * // => {
 * //   typeNames: ["UserId", "EmailAddress"],
 * //   rawImports: ["import { validators } from '@/lib'"]
 * // }
 * ```
 */
export function processImports(imports: string[]): {
  typeNames: string[];
  rawImports: string[];
} {
  const typeNames: string[] = [];
  const rawImports: string[] = [];

  for (const imp of imports) {
    if (isFullImportStatement(imp)) {
      rawImports.push(imp);
    } else {
      typeNames.push(imp);
    }
  }

  return { typeNames, rawImports };
}

/**
 * import行を生成（型名から相対パスimportへ変換）
 *
 * @param typeNames - 型名の配列
 * @param basePath - インポート元の相対パス（デフォルト: '.'）
 * @param useTypeKeyword - 'import type' を使うかどうか（デフォルト: true）
 * @returns import文の配列
 *
 * @example
 * ```typescript
 * generateTypeImports(["UserId", "EmailAddress"])
 * // => [
 * //   "import type { EmailAddress } from './EmailAddress';",
 * //   "import type { UserId } from './UserId';"
 * // ]
 *
 * generateTypeImports(["PetSchema"], ".", false)
 * // => ["import { PetSchema } from './PetSchema';"]
 * ```
 */
export function generateTypeImports(
  typeNames: string[],
  basePath = ".",
  useTypeKeyword = true,
): string[] {
  const sorted = [...typeNames].sort();
  const importKeyword = useTypeKeyword ? "import type" : "import";
  return sorted.map(
    (name) => `${importKeyword} { ${name} } from '${basePath}/${name}';`,
  );
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isFullImportStatement", () => {
    it("should return true for complete import statements", () => {
      expect(isFullImportStatement("import { foo } from 'bar'")).toBe(true);
      expect(isFullImportStatement("import * as foo from 'bar'")).toBe(true);
      expect(isFullImportStatement(" import { foo } from 'bar'")).toBe(true);
      expect(isFullImportStatement("  import { foo } from 'bar'  ")).toBe(true);
    });

    it("should return false for type names", () => {
      expect(isFullImportStatement("UserId")).toBe(false);
      expect(isFullImportStatement("EmailAddress")).toBe(false);
      expect(isFullImportStatement("  UserId  ")).toBe(false);
    });

    it("should return false for partial import-like strings", () => {
      expect(isFullImportStatement("imported from")).toBe(false);
      expect(isFullImportStatement("// import")).toBe(false);
    });
  });

  describe("processImports", () => {
    it("should separate type names and raw imports", () => {
      const imports = [
        "UserId",
        "import { validators } from '@/lib'",
        "EmailAddress",
        "import type { Branded } from '@/types'",
      ];

      const result = processImports(imports);

      expect(result.typeNames).toEqual(["UserId", "EmailAddress"]);
      expect(result.rawImports).toEqual([
        "import { validators } from '@/lib'",
        "import type { Branded } from '@/types'",
      ]);
    });

    it("should handle empty array", () => {
      const result = processImports([]);
      expect(result.typeNames).toEqual([]);
      expect(result.rawImports).toEqual([]);
    });

    it("should handle only type names", () => {
      const result = processImports(["UserId", "EmailAddress"]);
      expect(result.typeNames).toEqual(["UserId", "EmailAddress"]);
      expect(result.rawImports).toEqual([]);
    });

    it("should handle only raw imports", () => {
      const result = processImports([
        "import { foo } from 'bar'",
        "import * as baz from 'qux'",
      ]);
      expect(result.typeNames).toEqual([]);
      expect(result.rawImports).toEqual([
        "import { foo } from 'bar'",
        "import * as baz from 'qux'",
      ]);
    });
  });

  describe("generateTypeImports", () => {
    it("should generate import statements from type names", () => {
      const result = generateTypeImports(["UserId", "EmailAddress"]);
      expect(result).toEqual([
        "import type { EmailAddress } from './EmailAddress';",
        "import type { UserId } from './UserId';",
      ]);
    });

    it("should sort type names alphabetically", () => {
      const result = generateTypeImports(["ZType", "AType", "MType"]);
      expect(result).toEqual([
        "import type { AType } from './AType';",
        "import type { MType } from './MType';",
        "import type { ZType } from './ZType';",
      ]);
    });

    it("should handle custom base path", () => {
      const result = generateTypeImports(["UserId"], "../models");
      expect(result).toEqual([
        "import type { UserId } from '../models/UserId';",
      ]);
    });

    it("should handle empty array", () => {
      const result = generateTypeImports([]);
      expect(result).toEqual([]);
    });
  });
}
