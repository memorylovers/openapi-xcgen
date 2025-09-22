import type { OpenAPIV3_1 } from "openapi-types";

export type ReferenceObject = OpenAPIV3_1.ReferenceObject;

/**
 * オブジェクトが$ref参照オブジェクトかどうかを判定
 */
export function isReferenceObject(obj: unknown): obj is ReferenceObject {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === "object" &&
    "$ref" in obj
  );
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("Type Guards", () => {
    describe("isReferenceObject", () => {
      it("should identify reference object", () => {
        expect(isReferenceObject({ $ref: "#/components/schemas/User" })).toBe(
          true,
        );
        expect(isReferenceObject({ type: "string" })).toBe(false);
        expect(isReferenceObject(null)).toBe(false);
        expect(isReferenceObject(undefined)).toBe(false);
        expect(isReferenceObject("")).toBe(false);
        expect(isReferenceObject(123)).toBe(false);
        expect(isReferenceObject([])).toBe(false);
      });

      it("should handle edge cases", () => {
        expect(isReferenceObject({ $ref: "" })).toBe(true); // 空文字列でも$refがあればtrue
        expect(isReferenceObject({ $ref: null })).toBe(true); // nullでも$refキーがあればtrue
        expect(isReferenceObject({ ref: "#/components/schemas/User" })).toBe(
          false,
        ); // $なしはfalse
      });
    });
  });
}
