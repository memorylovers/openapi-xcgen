/**
 * TypeScript Union型生成
 *
 * IRUnionModelからTypeScriptのdiscriminated unionを生成する
 */

import type { IRModel } from "@openapi-xcgen/core";
import { toTypeName } from "../../helpers/naming.js";
import { irTypeToTsType } from "../../helpers/type-mapper.js";

/**
 * IRUnionModelからTypeScript discriminated unionを生成
 * @param model - IRUnionModel
 * @returns TypeScript discriminated union定義文字列
 *
 * @example
 * ```typescript
 * const model: IRModel = {
 *   kind: "union",
 *   name: "Shape",
 *   referencePath: "#/components/schemas/Shape",
 *   types: [
 *     { kind: "ref", name: "Circle", referencePath: "#/components/schemas/Circle" },
 *     { kind: "ref", name: "Square", referencePath: "#/components/schemas/Square" }
 *   ],
 *   discriminator: { propertyName: "type" }
 * };
 * generateUnionType(model);
 * // => "export type Shape = Circle | Square;"
 * ```
 */
export function generateUnionType(model: IRModel & { kind: "union" }): string {
  const typeName = toTypeName(model.name);
  const types = model.types.map((type) => irTypeToTsType(type));

  const lines: string[] = [];

  if (model.description) {
    lines.push("/**");
    lines.push(` * ${model.description}`);
    if (model.discriminator) {
      lines.push(` * @discriminator ${model.discriminator.propertyName}`);
    }
    lines.push(" */");
  }

  lines.push(`export type ${typeName} = ${types.join(" | ")};`);

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("types-union", () => {
    describe("generateUnionType", () => {
      it("should generate basic union type", () => {
        const model: IRModel & { kind: "union" } = {
          kind: "union",
          name: "Shape",
          referencePath: "#/components/schemas/Shape",
          types: [
            {
              kind: "ref",
              name: "Circle",
            },
            {
              kind: "ref",
              name: "Square",
            },
          ],
        };

        const result = generateUnionType(model);

        expect(result).toEqual("export type Shape = Circle | Square;");
      });

      it("should generate union with description", () => {
        const model: IRModel & { kind: "union" } = {
          kind: "union",
          name: "Vehicle",
          referencePath: "#/components/schemas/Vehicle",
          description: "Any type of vehicle",
          types: [
            {
              kind: "ref",
              name: "Car",
            },
            {
              kind: "ref",
              name: "Bike",
            },
          ],
        };

        const result = generateUnionType(model);

        expect(result).toEqual(
          `
/**
 * Any type of vehicle
 */
export type Vehicle = Car | Bike;
`.trim(),
        );
      });

      it("should generate union with discriminator", () => {
        const model: IRModel & { kind: "union" } = {
          kind: "union",
          name: "Event",
          referencePath: "#/components/schemas/Event",
          description: "Event with discriminator",
          discriminator: {
            propertyName: "eventType",
          },
          types: [
            {
              kind: "ref",
              name: "ClickEvent",
            },
            {
              kind: "ref",
              name: "ScrollEvent",
            },
          ],
        };

        const result = generateUnionType(model);

        expect(result).toEqual(
          `
/**
 * Event with discriminator
 * @discriminator eventType
 */
export type Event = ClickEvent | ScrollEvent;
`.trim(),
        );
      });
    });
  });
}
