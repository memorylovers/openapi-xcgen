/**
 * TypeScript AnyOf型生成
 *
 * IRAnyOfModelからTypeScriptのunion typeを生成する
 */

import type { IRModel } from "@openapi-xcgen/core";
import { toTypeName } from "../../helpers/naming.js";
import { irTypeToTsType } from "../../helpers/type-mapper.js";

/**
 * IRAnyOfModelからTypeScript union typeを生成
 * @param model - IRAnyOfModel
 * @returns TypeScript union type定義文字列
 *
 * @example
 * ```typescript
 * const model: IRModel = {
 *   kind: "anyOf",
 *   name: "Pet",
 *   referencePath: "#/components/schemas/Pet",
 *   schemas: [
 *     { kind: "ref", name: "Cat", referencePath: "#/components/schemas/Cat" },
 *     { kind: "ref", name: "Dog", referencePath: "#/components/schemas/Dog" }
 *   ],
 * };
 * generateAnyOfType(model);
 * // => "export type Pet = Cat | Dog;"
 * ```
 */
export function generateAnyOfType(model: IRModel & { kind: "anyOf" }): string {
  const typeName = toTypeName(model.name);
  const types = model.schemas.map((schema) => irTypeToTsType(schema));

  const lines: string[] = [];

  if (model.description) {
    lines.push("/**");
    lines.push(` * ${model.description}`);
    lines.push(" */");
  }

  lines.push(`export type ${typeName} = ${types.join(" | ")};`);

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("types-anyof", () => {
    describe("generateAnyOfType", () => {
      it("should generate basic anyOf type", () => {
        const model: IRModel & { kind: "anyOf" } = {
          kind: "anyOf",
          name: "Pet",
          referencePath: "#/components/schemas/Pet",
          schemas: [
            {
              kind: "ref",
              name: "Cat",
            },
            {
              kind: "ref",
              name: "Dog",
            },
          ],
        };

        const result = generateAnyOfType(model);

        expect(result).toEqual("export type Pet = Cat | Dog;");
      });

      it("should generate anyOf with description", () => {
        const model: IRModel & { kind: "anyOf" } = {
          kind: "anyOf",
          name: "Animal",
          referencePath: "#/components/schemas/Animal",
          description: "Any type of animal",
          schemas: [
            {
              kind: "ref",
              name: "Cat",
            },
            {
              kind: "ref",
              name: "Dog",
            },
          ],
        };

        const result = generateAnyOfType(model);

        expect(result).toEqual(
          `
/**
 * Any type of animal
 */
export type Animal = Cat | Dog;
`.trim(),
        );
      });

      it("should generate anyOf with multiple schemas", () => {
        const model: IRModel & { kind: "anyOf" } = {
          kind: "anyOf",
          name: "Shape",
          referencePath: "#/components/schemas/Shape",
          schemas: [
            {
              kind: "ref",
              name: "Circle",
            },
            {
              kind: "ref",
              name: "Square",
            },
            {
              kind: "ref",
              name: "Triangle",
            },
          ],
        };

        const result = generateAnyOfType(model);

        expect(result).toEqual(
          "export type Shape = Circle | Square | Triangle;",
        );
      });
    });
  });
}
