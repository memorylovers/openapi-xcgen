/**
 * TypeScript Enum型生成
 *
 * IREnumModelからTypeScriptのenum/union typeを生成する
 */

import type { IRModel } from "@openapi-xcgen/core";
import { toTypeName } from "../../helpers/naming.js";

/**
 * IREnumModelからTypeScript enum/union typeを生成
 * @param model - IREnumModel
 * @returns TypeScript enum/union type定義文字列
 *
 * @example
 * ```typescript
 * const model: IRModel = {
 *   kind: "enum",
 *   name: "Status",
 *   referencePath: "#/components/schemas/Status",
 *   type: "string",
 *   values: [
 *     { value: "active", name: "ACTIVE" },
 *     { value: "inactive", name: "INACTIVE" },
 *   ],
 * };
 * generateEnumType(model);
 * // => 'export type Status = "active" | "inactive";'
 * ```
 */
export function generateEnumType(model: IRModel & { kind: "enum" }): string {
  const lines: string[] = [];
  const typeName = toTypeName(model.name);

  // JSDocコメント
  if (model.description) {
    lines.push("/**");
    lines.push(` * ${model.description}`);
    lines.push(" */");
  }

  // string enumの場合はunion typeを使用（より型安全）
  const isStringEnum = model.values.every((v) => typeof v.value === "string");

  if (isStringEnum) {
    const values = model.values.map((v) => `"${v.value}"`).join(" | ");
    lines.push(`export type ${typeName} = ${values};`);
  } else {
    // number/mixedの場合はenumを使用
    lines.push(`export enum ${typeName} {`);
    for (const enumValue of model.values) {
      const key = String(enumValue.value).toUpperCase();
      lines.push(`  ${key} = ${JSON.stringify(enumValue.value)},`);
    }
    lines.push("}");
  }

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("types-enum", () => {
    describe("generateEnumType", () => {
      it("should generate string enum as union type", () => {
        const model: IRModel & { kind: "enum" } = {
          kind: "enum",
          name: "Status",
          referencePath: "#/components/schemas/Status",
          type: "string",
          values: [
            { value: "active", name: "ACTIVE" },
            { value: "inactive", name: "INACTIVE" },
            { value: "pending", name: "PENDING" },
          ],
        };

        const result = generateEnumType(model);

        expect(result).toEqual(
          `export type Status = "active" | "inactive" | "pending";`,
        );
      });

      it("should generate number enum", () => {
        const model: IRModel & { kind: "enum" } = {
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

        const result = generateEnumType(model);

        expect(result).toEqual(
          `
export enum Priority {
  1 = 1,
  2 = 2,
  3 = 3,
}
`.trim(),
        );
      });

      it("should generate enum with description", () => {
        const model: IRModel & { kind: "enum" } = {
          kind: "enum",
          name: "Role",
          referencePath: "#/components/schemas/Role",
          description: "User role type",
          type: "string",
          values: [
            { value: "admin", name: "ADMIN" },
            { value: "user", name: "USER" },
          ],
        };

        const result = generateEnumType(model);

        expect(result).toEqual(
          `
/**
 * User role type
 */
export type Role = "admin" | "user";
`.trim(),
        );
      });
    });
  });
}
