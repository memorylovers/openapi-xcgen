/**
 * JSDoc コメント関連のヘルパー関数
 */

/**
 * JSDocコメント内で安全に使用できるようにテキストをエスケープ
 *
 * コメント終了記号 `* /` (スペースなし) がコメントを途中で閉じないようにエスケープします。
 *
 * @param text - エスケープ対象のテキスト
 * @returns エスケープされたテキスト
 *
 * @example
 * ```typescript
 * escapeJSDocComment("Use glob patterns like * /")
 * // => "Use glob patterns like *\\/"
 * ```
 */
export function escapeJSDocComment(text: string): string {
  return text.replace(/\*\//g, "*\\/");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("escapeJSDocComment", () => {
    it("should escape comment terminator", () => {
      expect(escapeJSDocComment("pattern: */.json")).toBe("pattern: *\\/.json");
    });

    it("should escape multiple comment terminators", () => {
      expect(escapeJSDocComment("start */ middle */ end")).toBe(
        "start *\\/ middle *\\/ end",
      );
    });

    it("should not modify text without comment terminators", () => {
      expect(escapeJSDocComment("normal text")).toBe("normal text");
    });

    it("should handle empty string", () => {
      expect(escapeJSDocComment("")).toBe("");
    });

    it("should handle text with asterisks but no slashes", () => {
      expect(escapeJSDocComment("Use * for wildcard")).toBe(
        "Use * for wildcard",
      );
    });

    it("should handle text with slashes but no asterisks", () => {
      expect(escapeJSDocComment("Use / for division")).toBe(
        "Use / for division",
      );
    });

    it("should escape at the beginning of text", () => {
      expect(escapeJSDocComment("*/ starts here")).toBe("*\\/ starts here");
    });

    it("should escape at the end of text", () => {
      expect(escapeJSDocComment("ends here */")).toBe("ends here *\\/");
    });
  });
}
