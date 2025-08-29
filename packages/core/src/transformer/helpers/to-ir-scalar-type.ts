import type { IRScalarType } from "../../types/ir/index";

/**
 * OpenAPIのtype値をIRScalarTypeに変換
 * @param type - OpenAPIのtype値
 * @returns IRScalarType、無効な場合はnull
 *
 * @example
 * ```typescript
 * toIRScalarType("string")   // "string"
 * toIRScalarType("number")   // "number"
 * toIRScalarType("integer")  // "integer"
 * toIRScalarType("boolean")  // "boolean"
 * toIRScalarType("array")    // null
 * toIRScalarType("object")   // null
 * toIRScalarType(undefined)  // null
 * ```
 */
export function toIRScalarType(type: unknown): IRScalarType | null {
  const validTypes: IRScalarType[] = ["string", "number", "integer", "boolean"];

  if (validTypes.includes(type as IRScalarType)) {
    return type as IRScalarType;
  }

  return null;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("toIRScalarType", () => {
    it("should return string for string type", () => {
      expect(toIRScalarType("string")).toBe("string");
    });

    it("should return number for number type", () => {
      expect(toIRScalarType("number")).toBe("number");
    });

    it("should return integer for integer type", () => {
      expect(toIRScalarType("integer")).toBe("integer");
    });

    it("should return boolean for boolean type", () => {
      expect(toIRScalarType("boolean")).toBe("boolean");
    });

    it("should return null for non-scalar types", () => {
      expect(toIRScalarType("array")).toBe(null);
      expect(toIRScalarType("object")).toBe(null);
      expect(toIRScalarType("null")).toBe(null);
    });

    it("should return null for undefined or null", () => {
      expect(toIRScalarType(undefined)).toBe(null);
      expect(toIRScalarType(null)).toBe(null);
    });

    it("should return null for empty string", () => {
      expect(toIRScalarType("")).toBe(null);
    });

    it("should return null for non-string types", () => {
      expect(toIRScalarType(123)).toBe(null);
      expect(toIRScalarType({})).toBe(null);
      expect(toIRScalarType([])).toBe(null);
      expect(toIRScalarType(true)).toBe(null);
    });
  });
}
