import type { IRParameterInType } from "../../types/ir/index.js";

/**
 * OpenAPIのparameter.in値をIRParameterInTypeに変換
 * @param value - OpenAPIのparameter.in値
 * @returns IRParameterInType、無効な場合はnull
 *
 * @example
 * ```typescript
 * toIRParameterInType("path")    // "path"
 * toIRParameterInType("query")   // "query"
 * toIRParameterInType("header")  // "header"
 * toIRParameterInType("cookie")  // "cookie"
 * toIRParameterInType("body")    // null (OpenAPI 3.xでは無効)
 * toIRParameterInType("formData") // null (OpenAPI 3.xでは無効)
 * toIRParameterInType(undefined) // null
 * ```
 */
export function toIRParameterInType(value: unknown): IRParameterInType | null {
  const validTypes: IRParameterInType[] = ["path", "query", "header", "cookie"];

  if (validTypes.includes(value as IRParameterInType)) {
    return value as IRParameterInType;
  }

  return null;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("toIRParameterInType", () => {
    it("should return path for path type", () => {
      expect(toIRParameterInType("path")).toBe("path");
    });

    it("should return query for query type", () => {
      expect(toIRParameterInType("query")).toBe("query");
    });

    it("should return header for header type", () => {
      expect(toIRParameterInType("header")).toBe("header");
    });

    it("should return cookie for cookie type", () => {
      expect(toIRParameterInType("cookie")).toBe("cookie");
    });

    it("should return null for OpenAPI 2.x parameter types", () => {
      expect(toIRParameterInType("body")).toBe(null);
      expect(toIRParameterInType("formData")).toBe(null);
    });

    it("should return null for invalid types", () => {
      expect(toIRParameterInType("invalid")).toBe(null);
      expect(toIRParameterInType("")).toBe(null);
      expect(toIRParameterInType("PATH")).toBe(null); // case sensitive
      expect(toIRParameterInType("Query")).toBe(null); // case sensitive
    });

    it("should return null for undefined or null", () => {
      expect(toIRParameterInType(undefined)).toBe(null);
      expect(toIRParameterInType(null)).toBe(null);
    });

    it("should return null for non-string types", () => {
      expect(toIRParameterInType(123)).toBe(null);
      expect(toIRParameterInType({})).toBe(null);
      expect(toIRParameterInType([])).toBe(null);
      expect(toIRParameterInType(true)).toBe(null);
    });
  });
}
