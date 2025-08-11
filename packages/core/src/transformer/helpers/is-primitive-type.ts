/**
 * プリミティブ型かどうかを判定
 * @param type - 判定対象の型
 * @returns プリミティブ型の場合true
 *
 * @example OpenAPI YAML
 * ```yaml
 * # プリミティブ型（true を返す）
 * string_field:
 *   type: string
 *
 * number_field:
 *   type: number
 *
 * integer_field:
 *   type: integer
 *
 * boolean_field:
 *   type: boolean
 *
 * # 非プリミティブ型（false を返す）
 * array_field:
 *   type: array
 *   items:
 *     type: string
 *
 * object_field:
 *   type: object
 *   properties:
 *     name:
 *       type: string
 * ```
 */
export function isPrimitiveType(type: unknown): boolean {
  return ["string", "number", "integer", "boolean"].includes(type as string);
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isPrimitiveType", () => {
    it("should return true for primitive types", () => {
      expect(isPrimitiveType("string")).toBe(true);
      expect(isPrimitiveType("number")).toBe(true);
      expect(isPrimitiveType("integer")).toBe(true);
      expect(isPrimitiveType("boolean")).toBe(true);
    });

    it("should return false for non-primitive types", () => {
      expect(isPrimitiveType("array")).toBe(false);
      expect(isPrimitiveType("object")).toBe(false);
      expect(isPrimitiveType(undefined)).toBe(false);
      expect(isPrimitiveType(null)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isPrimitiveType("")).toBe(false);
    });

    it("should return false for non-string types", () => {
      expect(isPrimitiveType(123)).toBe(false);
      expect(isPrimitiveType({})).toBe(false);
      expect(isPrimitiveType([])).toBe(false);
    });
  });
}
