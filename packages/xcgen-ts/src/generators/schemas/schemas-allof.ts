/**
 * AllOfスキーマ生成
 */

/**
 * AllOf型のValibotスキーマを生成
 * @param schemaRefs - スキーマ参照の配列
 * @returns Valibotスキーマ文字列
 *
 * @example
 * ```typescript
 * generateAllOfSchema(["AnimalSchema", "DogPropsSchema"])
 * // => "v.intersect([AnimalSchema, DogPropsSchema])"
 * ```
 */
export function generateAllOfSchema(schemaRefs: string[]): string {
  if (schemaRefs.length === 0) {
    throw new Error("AllOf must have at least one schema");
  }

  if (schemaRefs.length === 1) {
    // 1つだけの場合はintersect不要
    return schemaRefs[0];
  }

  return `v.intersect([${schemaRefs.join(", ")}])`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("schemas-allof", () => {
    describe("generateAllOfSchema", () => {
      it("should return single schema when only one schema is provided", () => {
        const result = generateAllOfSchema(["PetSchema"]);
        expect(result).toBe("PetSchema");
      });

      it("should generate intersect for two schemas", () => {
        const result = generateAllOfSchema(["AnimalSchema", "DogPropsSchema"]);
        expect(result).toBe("v.intersect([AnimalSchema, DogPropsSchema])");
      });

      it("should generate intersect for multiple schemas", () => {
        const result = generateAllOfSchema([
          "BaseSchema",
          "MixinASchema",
          "MixinBSchema",
        ]);
        expect(result).toBe(
          "v.intersect([BaseSchema, MixinASchema, MixinBSchema])",
        );
      });

      it("should throw error when schema array is empty", () => {
        expect(() => generateAllOfSchema([])).toThrow(
          "AllOf must have at least one schema",
        );
      });
    });
  });
}
