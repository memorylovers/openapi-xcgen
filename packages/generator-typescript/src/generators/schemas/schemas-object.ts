/**
 * Objectスキーマ生成
 */

/**
 * プロパティスキーマ情報
 */
export interface PropertySchema {
  /** プロパティ名 */
  name: string;
  /** スキーマ文字列 */
  schema: string;
  /** optional */
  optional: boolean;
  /** nullable */
  nullable: boolean;
  /** readOnly (コメント用) */
  readOnly?: boolean;
}

/**
 * Object型のValibotスキーマを生成
 * @param properties - プロパティスキーマ配列
 * @returns Valibotスキーマ文字列
 *
 * @example
 * ```typescript
 * generateObjectSchema([
 *   { name: "id", schema: "v.string()", optional: false, nullable: false },
 *   { name: "name", schema: "v.string()", optional: false, nullable: false },
 *   { name: "age", schema: "v.number()", optional: true, nullable: true },
 * ])
 * // =>
 * // v.object({
 * //   id: v.string(),
 * //   name: v.string(),
 * //   age: v.optional(v.nullable(v.number())),
 * // })
 * ```
 */
export function generateObjectSchema(properties: PropertySchema[]): string {
  if (properties.length === 0) {
    return "v.object({})";
  }

  const lines: string[] = [];
  lines.push("v.object({");

  for (const prop of properties) {
    let schema = prop.schema;

    // nullable → v.nullable()
    if (prop.nullable) {
      schema = `v.nullable(${schema})`;
    }

    // optional → v.optional()
    if (prop.optional) {
      schema = `v.optional(${schema})`;
    }

    // readOnlyコメント
    const comment = prop.readOnly ? " // readOnly" : "";

    lines.push(`  ${prop.name}: ${schema},${comment}`);
  }

  lines.push("})");

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("schemas-object", () => {
    describe("generateObjectSchema", () => {
      it("should generate empty object schema", () => {
        const result = generateObjectSchema([]);
        expect(result).toBe("v.object({})");
      });

      it("should generate object schema with required properties", () => {
        const result = generateObjectSchema([
          {
            name: "id",
            schema: "v.string()",
            optional: false,
            nullable: false,
          },
          {
            name: "name",
            schema: "v.string()",
            optional: false,
            nullable: false,
          },
        ]);

        expect(result).toEqual(
          `
v.object({
  id: v.string(),
  name: v.string(),
})
`.trim(),
        );
      });

      it("should generate object schema with optional property", () => {
        const result = generateObjectSchema([
          {
            name: "age",
            schema: "v.number()",
            optional: true,
            nullable: false,
          },
        ]);

        expect(result).toEqual(
          `
v.object({
  age: v.optional(v.number()),
})
`.trim(),
        );
      });

      it("should generate object schema with nullable property", () => {
        const result = generateObjectSchema([
          {
            name: "email",
            schema: "v.string()",
            optional: false,
            nullable: true,
          },
        ]);

        expect(result).toEqual(
          `
v.object({
  email: v.nullable(v.string()),
})
`.trim(),
        );
      });

      it("should generate object schema with optional and nullable property", () => {
        const result = generateObjectSchema([
          {
            name: "description",
            schema: "v.string()",
            optional: true,
            nullable: true,
          },
        ]);

        expect(result).toEqual(
          `
v.object({
  description: v.optional(v.nullable(v.string())),
})
`.trim(),
        );
      });

      it("should add readOnly comment", () => {
        const result = generateObjectSchema([
          {
            name: "id",
            schema: "v.string()",
            optional: false,
            nullable: false,
            readOnly: true,
          },
        ]);

        expect(result).toEqual(
          `
v.object({
  id: v.string(), // readOnly
})
`.trim(),
        );
      });
    });
  });
}
