import type { SchemaObjectWithNullable } from "../../types";

/**
 * スキーマがnullableかどうかを判定
 *
 * OpenAPI 3.0と3.1の両方の形式に対応：
 * - OpenAPI 3.0: nullable: true
 * - OpenAPI 3.1: type: ["string", "null"] または type: ["null", "string"]
 *
 * @param schema - 判定対象のスキーマ
 * @returns nullableの場合true、それ以外はfalse
 *
 * @example
 * ```typescript
 * // OpenAPI 3.0形式
 * isNullable({ type: "string", nullable: true })  // true
 * isNullable({ type: "string", nullable: false }) // false
 * isNullable({ type: "string" })                  // false
 *
 * // OpenAPI 3.1形式
 * isNullable({ type: ["string", "null"] })        // true
 * isNullable({ type: ["null", "string"] })        // true
 * isNullable({ type: "string" })                  // false
 *
 * // 複合ケース
 * isNullable({ type: ["string", "number"] })      // false (nullが含まれていない)
 * isNullable({ type: ["string", "null", "number"] }) // true (nullが含まれている)
 * ```
 */
export function isNullable(
  schema: SchemaObjectWithNullable | undefined | null,
): boolean {
  if (!schema) {
    return false;
  }

  // OpenAPI 3.0形式: nullable属性をチェック
  if ("nullable" in schema && schema.nullable === true) {
    return true;
  }

  // OpenAPI 3.1形式: type配列に"null"が含まれているかチェック
  if (Array.isArray(schema.type)) {
    return schema.type.includes("null");
  }

  return false;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("isNullable", () => {
    describe("OpenAPI 3.0 format", () => {
      it("should return true for nullable: true", () => {
        expect(isNullable({ type: "string", nullable: true })).toBe(true);
        expect(isNullable({ type: "number", nullable: true })).toBe(true);
        expect(isNullable({ type: "object", nullable: true })).toBe(true);
      });

      it("should return false for nullable: false", () => {
        expect(isNullable({ type: "string", nullable: false })).toBe(false);
      });

      it("should return false when nullable is not specified", () => {
        expect(isNullable({ type: "string" })).toBe(false);
        expect(isNullable({ type: "number" })).toBe(false);
      });
    });

    describe("OpenAPI 3.1 format", () => {
      it("should return true when type array includes null", () => {
        expect(isNullable({ type: ["string", "null"] })).toBe(true);
        expect(isNullable({ type: ["null", "string"] })).toBe(true);
        expect(isNullable({ type: ["string", "number", "null"] })).toBe(true);
      });

      it("should return false when type array does not include null", () => {
        expect(isNullable({ type: ["string", "number"] })).toBe(false);
        expect(isNullable({ type: ["string"] })).toBe(false);
      });

      it("should return false for non-array type", () => {
        expect(isNullable({ type: "string" })).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("should return false for undefined or null schema", () => {
        expect(isNullable(undefined)).toBe(false);
        expect(isNullable(null)).toBe(false);
      });

      it("should return false for empty object", () => {
        expect(isNullable({})).toBe(false);
      });

      it("should handle combined format (3.0 and 3.1)", () => {
        // 両方の形式が指定された場合（通常はないが）
        expect(isNullable({ type: ["string", "null"], nullable: true })).toBe(
          true,
        );
        expect(isNullable({ type: ["string"], nullable: true })).toBe(true);
        expect(isNullable({ type: ["string", "null"], nullable: false })).toBe(
          true,
        ); // type配列が優先
      });
    });
  });
}
