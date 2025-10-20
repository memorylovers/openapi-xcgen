/**
 * Union (discriminated union) スキーマ生成
 */

/**
 * Variant option
 */
export interface VariantOption {
  /** Discriminator value */
  key: string;
  /** Schema reference */
  schemaRef: string;
}

/**
 * Union型 (discriminated union) のValibotスキーマを生成
 * @param discriminatorKey - Discriminatorプロパティ名
 * @param options - Variant options (key → schemaRef mapping)
 * @returns Valibotスキーマ文字列
 *
 * @example
 * ```typescript
 * generateUnionSchema('type', [
 *   { key: 'cat', schemaRef: 'CatSchema' },
 *   { key: 'dog', schemaRef: 'DogSchema' },
 * ])
 * // =>
 * // v.variant('type', {
 * //   cat: CatSchema,
 * //   dog: DogSchema,
 * // })
 * ```
 */
export function generateUnionSchema(
  discriminatorKey: string,
  options: VariantOption[],
): string {
  if (options.length === 0) {
    throw new Error("Union must have at least one variant");
  }

  if (options.length === 1) {
    // 1つだけの場合はvariant不要
    return options[0].schemaRef;
  }

  // Valibot v1のvariantは配列形式を使用
  const lines: string[] = [];
  lines.push(`v.variant("${discriminatorKey}", [`);

  for (const option of options) {
    lines.push(`  ${option.schemaRef},`);
  }

  lines.push("])");

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("schemas-union", () => {
    describe("generateUnionSchema", () => {
      it("should return single schema when only one option is provided", () => {
        const result = generateUnionSchema("type", [
          { key: "cat", schemaRef: "CatSchema" },
        ]);
        expect(result).toBe("CatSchema");
      });

      it("should generate variant for two options", () => {
        const result = generateUnionSchema("type", [
          { key: "cat", schemaRef: "CatSchema" },
          { key: "dog", schemaRef: "DogSchema" },
        ]);

        expect(result).toEqual(
          `
v.variant("type", [
  CatSchema,
  DogSchema,
])
`.trim(),
        );
      });

      it("should generate variant for multiple options", () => {
        const result = generateUnionSchema("petType", [
          { key: "cat", schemaRef: "CatSchema" },
          { key: "dog", schemaRef: "DogSchema" },
          { key: "bird", schemaRef: "BirdSchema" },
        ]);

        expect(result).toEqual(
          `
v.variant("petType", [
  CatSchema,
  DogSchema,
  BirdSchema,
])
`.trim(),
        );
      });

      it("should throw error when options array is empty", () => {
        expect(() => generateUnionSchema("type", [])).toThrow(
          "Union must have at least one variant",
        );
      });
    });
  });
}
