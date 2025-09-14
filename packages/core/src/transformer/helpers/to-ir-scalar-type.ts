import type { IRScalarType } from "../../types/ir/index";

/**
 * OpenAPIのtype+formatをIRScalarTypeに変換
 * @param type - OpenAPIのtype値
 * @param format - OpenAPIのformat値（オプション）
 * @returns IRScalarType、無効な場合はnull
 *
 * @example
 * ```typescript
 * // 整数型
 * toIRScalarType("integer")           // "int"
 * toIRScalarType("integer", "int32")  // "int"
 * toIRScalarType("integer", "int64")  // "long"
 *
 * // 浮動小数点型
 * toIRScalarType("number")            // "double"
 * toIRScalarType("number", "float")   // "float"
 * toIRScalarType("number", "double")  // "double"
 *
 * // 文字列型
 * toIRScalarType("string")            // "string"
 * toIRScalarType("string", "date")    // "date"
 * toIRScalarType("string", "date-time") // "datetime"
 * toIRScalarType("string", "binary")  // "binary"
 * toIRScalarType("string", "byte")    // "byte"
 * toIRScalarType("string", "uuid")    // "string" (通常のstring扱い)
 *
 * // 真偽値型
 * toIRScalarType("boolean")           // "boolean"
 *
 * // 無効な型
 * toIRScalarType("array")             // null (配列型はスカラーではない)
 * toIRScalarType("object")            // null (オブジェクト型はスカラーではない)
 * ```
 */
export function toIRScalarType(
  type: string,
  format?: string | null,
): IRScalarType | null {
  // 整数型
  if (type === "integer") {
    if (format === "int64") return "long";

    return "int"; // int32またはformatなしはデフォルトでint
  }

  // 数値型
  if (type === "number") {
    if (format === "float") return "float";

    return "double"; // doubleまたはformatなしはデフォルトでdouble
  }

  // 文字列型（formatによって分岐）
  if (type === "string") {
    switch (format) {
      case "date":
        return "date";
      case "date-time":
        return "datetime";
      case "binary":
        return "binary";
      case "byte":
        return "byte";
      // uuid, email, uri等は通常のstring扱い
      default:
        return "string";
    }
  }

  // 真偽値型
  if (type === "boolean") return "boolean";

  return null;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("toIRScalarType", () => {
    // 整数型のテスト
    describe("integer types", () => {
      it("should return int for integer without format", () => {
        expect(toIRScalarType("integer")).toBe("int");
      });

      it("should return int for integer with int32 format", () => {
        expect(toIRScalarType("integer", "int32")).toBe("int");
      });

      it("should return long for integer with int64 format", () => {
        expect(toIRScalarType("integer", "int64")).toBe("long");
      });

      it("should return int for integer with unknown format", () => {
        expect(toIRScalarType("integer", "unknown")).toBe("int");
      });
    });

    // 数値型のテスト
    describe("number types", () => {
      it("should return double for number without format", () => {
        expect(toIRScalarType("number")).toBe("double");
      });

      it("should return float for number with float format", () => {
        expect(toIRScalarType("number", "float")).toBe("float");
      });

      it("should return double for number with double format", () => {
        expect(toIRScalarType("number", "double")).toBe("double");
      });

      it("should return double for number with unknown format", () => {
        expect(toIRScalarType("number", "unknown")).toBe("double");
      });
    });

    // 文字列型のテスト
    describe("string types", () => {
      it("should return string for string without format", () => {
        expect(toIRScalarType("string")).toBe("string");
      });

      it("should return date for string with date format", () => {
        expect(toIRScalarType("string", "date")).toBe("date");
      });

      it("should return datetime for string with date-time format", () => {
        expect(toIRScalarType("string", "date-time")).toBe("datetime");
      });

      it("should return binary for string with binary format", () => {
        expect(toIRScalarType("string", "binary")).toBe("binary");
      });

      it("should return byte for string with byte format", () => {
        expect(toIRScalarType("string", "byte")).toBe("byte");
      });

      it("should return string for string with uuid format", () => {
        expect(toIRScalarType("string", "uuid")).toBe("string");
      });

      it("should return string for string with email format", () => {
        expect(toIRScalarType("string", "email")).toBe("string");
      });

      it("should return string for string with uri format", () => {
        expect(toIRScalarType("string", "uri")).toBe("string");
      });

      it("should return string for string with unknown format", () => {
        expect(toIRScalarType("string", "unknown")).toBe("string");
      });
    });

    // 真偽値型のテスト
    describe("boolean types", () => {
      it("should return boolean for boolean type", () => {
        expect(toIRScalarType("boolean")).toBe("boolean");
      });

      it("should return boolean for boolean with any format", () => {
        expect(toIRScalarType("boolean", "any")).toBe("boolean");
      });
    });

    // 無効な型のテスト
    describe("invalid types", () => {
      it("should return null for non-scalar types", () => {
        expect(toIRScalarType("array")).toBe(null);
        expect(toIRScalarType("object")).toBe(null);
        expect(toIRScalarType("null")).toBe(null);
      });

      it("should return null for empty string", () => {
        expect(toIRScalarType("")).toBe(null);
      });
    });
  });
}
