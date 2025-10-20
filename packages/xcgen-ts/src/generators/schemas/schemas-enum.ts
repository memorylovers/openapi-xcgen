/**
 * Enumスキーマ生成
 */

import type { IREnumModel } from "@openapi-xcgen/core";

/**
 * IREnumModelのValibotスキーマを生成
 * @param model - IREnum モデル
 * @returns Valibotスキーマ文字列
 *
 * @example
 * ```typescript
 * generateEnumSchema({
 *   kind: "enum",
 *   name: "Status",
 *   values: ["pending", "active", "inactive"]
 * })
 * // => 'v.picklist(["pending", "active", "inactive"])'
 * ```
 */
export function generateEnumSchema(model: IREnumModel): string {
  // IREnumValue.valueを取り出して文字列または数値としてシリアライズ
  const serializedValues = model.values.map((enumValue) => {
    const value = enumValue.value;
    if (typeof value === "string") {
      // 文字列は引用符でエスケープ
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    // 数値はそのまま
    return String(value);
  });

  const valuesList = serializedValues.join(", ");
  return `v.picklist([${valuesList}])`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("schemas-enum", () => {
    describe("generateEnumSchema", () => {
      it("should generate picklist for string enum", () => {
        const model: IREnumModel = {
          kind: "enum",
          name: "Status",
          referencePath: "#/components/schemas/Status",
          type: "string",
          values: [
            { value: "pending", name: "PENDING" },
            { value: "active", name: "ACTIVE" },
            { value: "inactive", name: "INACTIVE" },
          ],
        };

        const result = generateEnumSchema(model);

        expect(result).toBe('v.picklist(["pending", "active", "inactive"])');
      });

      it("should generate picklist for number enum", () => {
        const model: IREnumModel = {
          kind: "enum",
          name: "Priority",
          referencePath: "#/components/schemas/Priority",
          type: "int",
          values: [
            { value: 1, name: "LOW" },
            { value: 2, name: "MEDIUM" },
            { value: 3, name: "HIGH" },
          ],
        };

        const result = generateEnumSchema(model);

        expect(result).toBe("v.picklist([1, 2, 3])");
      });

      it("should handle mixed string/number enum", () => {
        const model: IREnumModel = {
          kind: "enum",
          name: "Mixed",
          referencePath: "#/components/schemas/Mixed",
          type: "string",
          values: [
            { value: "a", name: "A" },
            { value: 1, name: "ONE" },
            { value: "b", name: "B" },
            { value: 2, name: "TWO" },
          ],
        };

        const result = generateEnumSchema(model);

        expect(result).toBe('v.picklist(["a", 1, "b", 2])');
      });

      it("should escape double quotes in string values", () => {
        const model: IREnumModel = {
          kind: "enum",
          name: "WithQuotes",
          referencePath: "#/components/schemas/WithQuotes",
          type: "string",
          values: [{ value: 'value with "quotes"', name: "WITH_QUOTES" }],
        };

        const result = generateEnumSchema(model);

        expect(result).toBe('v.picklist(["value with \\"quotes\\""])');
      });
    });
  });
}
