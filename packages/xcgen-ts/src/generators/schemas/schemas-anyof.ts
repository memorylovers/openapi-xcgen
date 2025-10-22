/**
 * AnyOfスキーマ生成
 */

/**
 * AnyOf型のValibotスキーマを生成
 * @param schemaRefs - スキーマ参照の配列
 * @returns Valibotスキーマ文字列
 *
 * @example
 * ```typescript
 * generateAnyOfSchema(["AppleSchema", "BananaSchema"])
 * // => "v.union([AppleSchema, BananaSchema])"
 * ```
 */
export function generateAnyOfSchema(schemaRefs: string[]): string {
  if (schemaRefs.length === 0) {
    throw new Error("AnyOf must have at least one schema");
  }

  if (schemaRefs.length === 1) {
    // 1つだけの場合はunion不要
    return schemaRefs[0];
  }

  return `v.union([${schemaRefs.join(", ")}])`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("schemas-anyof", () => {
    describe("generateAnyOfSchema", () => {
      it("should return single schema when only one schema is provided", () => {
        const result = generateAnyOfSchema(["PetSchema"]);
        expect(result).toBe("PetSchema");
      });

      it("should generate union for two schemas", () => {
        const result = generateAnyOfSchema(["AppleSchema", "BananaSchema"]);
        expect(result).toBe("v.union([AppleSchema, BananaSchema])");
      });

      it("should generate union for multiple schemas", () => {
        const result = generateAnyOfSchema([
          "CatSchema",
          "DogSchema",
          "BirdSchema",
        ]);
        expect(result).toBe("v.union([CatSchema, DogSchema, BirdSchema])");
      });

      it("should throw error when schema array is empty", () => {
        expect(() => generateAnyOfSchema([])).toThrow(
          "AnyOf must have at least one schema",
        );
      });
    });
  });
}
