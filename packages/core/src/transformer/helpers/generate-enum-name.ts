/**
 * enum値から定数名を生成
 * @param value - enum値
 * @returns 定数名（大文字・アンダースコア区切り）
 *
 * @example
 * ```typescript
 * generateEnumName("pending")      // "PENDING"
 * generateEnumName("in-progress")  // "IN_PROGRESS"
 * generateEnumName("on_hold")      // "ON_HOLD"
 * generateEnumName("completed!")   // "COMPLETED_"
 * generateEnumName(1)              // "VALUE_1"
 * generateEnumName(42)             // "VALUE_42"
 * ```
 */
export function generateEnumName(value: unknown): string {
  // 数値の場合は"VALUE_"プレフィックスを付ける
  if (typeof value === "number") return `VALUE_${value}`;

  // 文字列の場合は大文字に変換し、特殊文字をアンダースコアに置換
  const name = String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_");

  // 先頭のアンダースコアのみ削除（末尾は保持）
  return name.replace(/^_+/, "");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("generateEnumName", () => {
    it("should generate name for string values", () => {
      expect(generateEnumName("pending")).toBe("PENDING");
      expect(generateEnumName("approved")).toBe("APPROVED");
      expect(generateEnumName("rejected")).toBe("REJECTED");
    });

    it("should generate name for number values with VALUE_ prefix", () => {
      expect(generateEnumName(1)).toBe("VALUE_1");
      expect(generateEnumName(2)).toBe("VALUE_2");
      expect(generateEnumName(42)).toBe("VALUE_42");
      expect(generateEnumName(0)).toBe("VALUE_0");
      expect(generateEnumName(-1)).toBe("VALUE_-1");
    });

    it("should handle string values with special characters", () => {
      expect(generateEnumName("in-progress")).toBe("IN_PROGRESS");
      expect(generateEnumName("on_hold")).toBe("ON_HOLD");
      expect(generateEnumName("completed!")).toBe("COMPLETED_");
      expect(generateEnumName("new/pending")).toBe("NEW_PENDING");
      expect(generateEnumName("foo.bar")).toBe("FOO_BAR");
      expect(generateEnumName("test@email")).toBe("TEST_EMAIL");
    });

    it("should handle edge cases", () => {
      // 空文字列
      expect(generateEnumName("")).toBe("");

      // 特殊文字のみ
      expect(generateEnumName("!!!")).toBe("");
      expect(generateEnumName("---")).toBe("");

      // 先頭に特殊文字
      expect(generateEnumName("-status")).toBe("STATUS");
      expect(generateEnumName("@admin")).toBe("ADMIN");

      // 末尾に特殊文字（末尾のアンダースコアは保持）
      expect(generateEnumName("pending-")).toBe("PENDING_");
      expect(generateEnumName("active!")).toBe("ACTIVE_");
    });

    it("should handle non-string, non-number values", () => {
      // boolean
      expect(generateEnumName(true)).toBe("TRUE");
      expect(generateEnumName(false)).toBe("FALSE");

      // null/undefined
      expect(generateEnumName(null)).toBe("NULL");
      expect(generateEnumName(undefined)).toBe("UNDEFINED");

      // object
      expect(generateEnumName({})).toBe("OBJECT_OBJECT_");
      expect(generateEnumName([])).toBe("");
    });
  });
}
