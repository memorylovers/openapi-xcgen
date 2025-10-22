/**
 * プリミティブ型スキーマ生成
 */

import type { IRScalarType } from "@openapi-xcgen/core";

/**
 * プリミティブ型のValibotスキーマを生成
 * @param type - IRスカラー型
 * @returns Valibotスキーマ文字列
 *
 * @example
 * ```typescript
 * generatePrimitiveSchema("string")   // => "v.string()"
 * generatePrimitiveSchema("int")      // => "v.number()"
 * generatePrimitiveSchema("long")     // => "v.number()"
 * generatePrimitiveSchema("float")    // => "v.number()"
 * generatePrimitiveSchema("double")   // => "v.number()"
 * generatePrimitiveSchema("boolean")  // => "v.boolean()"
 * generatePrimitiveSchema("null")     // => "v.null()"
 * generatePrimitiveSchema("date")     // => "v.pipe(v.string(), v.isoDate(), v.transform((val) => new Date(val)))"
 * generatePrimitiveSchema("datetime") // => "v.pipe(v.string(), v.isoDateTime(), v.transform((val) => new Date(val)))"
 * generatePrimitiveSchema("byte")     // => "v.pipe(v.string(), v.base64())"
 * generatePrimitiveSchema("binary")   // => "v.instance(Blob)"
 * ```
 */
export function generatePrimitiveSchema(type: IRScalarType): string {
  switch (type) {
    case "string":
      return "v.string()";
    case "int":
    case "long":
    case "float":
    case "double":
      return "v.number()";
    case "boolean":
      return "v.boolean()";
    case "null":
      return "v.null()";
    case "date":
      return "v.pipe(v.string(), v.isoDate(), v.transform((val) => new Date(val)))";
    case "datetime":
      return "v.pipe(v.string(), v.isoDateTime(), v.transform((val) => new Date(val)))";
    case "byte":
      return "v.pipe(v.string(), v.base64())";
    case "binary":
      return "v.instance(Blob)";
    default:
      // 到達不可能（IRScalarTypeの全ケースを網羅）
      throw new Error(`Unsupported scalar type: ${type}`);
  }
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("schemas-primitive", () => {
    describe("generatePrimitiveSchema", () => {
      it("should generate string schema", () => {
        const result = generatePrimitiveSchema("string");
        expect(result).toBe("v.string()");
      });

      it("should generate int schema as number", () => {
        const result = generatePrimitiveSchema("int");
        expect(result).toBe("v.number()");
      });

      it("should generate long schema as number", () => {
        const result = generatePrimitiveSchema("long");
        expect(result).toBe("v.number()");
      });

      it("should generate float schema as number", () => {
        const result = generatePrimitiveSchema("float");
        expect(result).toBe("v.number()");
      });

      it("should generate double schema as number", () => {
        const result = generatePrimitiveSchema("double");
        expect(result).toBe("v.number()");
      });

      it("should generate boolean schema", () => {
        const result = generatePrimitiveSchema("boolean");
        expect(result).toBe("v.boolean()");
      });

      it("should generate null schema", () => {
        const result = generatePrimitiveSchema("null");
        expect(result).toBe("v.null()");
      });

      it("should generate date schema with validation and transformation", () => {
        const result = generatePrimitiveSchema("date");
        expect(result).toBe(
          "v.pipe(v.string(), v.isoDate(), v.transform((val) => new Date(val)))",
        );
      });

      it("should generate datetime schema with validation and transformation", () => {
        const result = generatePrimitiveSchema("datetime");
        expect(result).toBe(
          "v.pipe(v.string(), v.isoDateTime(), v.transform((val) => new Date(val)))",
        );
      });

      it("should generate byte schema with base64 validation", () => {
        const result = generatePrimitiveSchema("byte");
        expect(result).toBe("v.pipe(v.string(), v.base64())");
      });

      it("should generate binary schema as Blob instance", () => {
        const result = generatePrimitiveSchema("binary");
        expect(result).toBe("v.instance(Blob)");
      });
    });
  });
}
