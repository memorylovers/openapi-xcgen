/**
 * TypeScript Map型生成
 *
 * IRMapSchemaからTypeScriptのRecord type aliasを生成する
 */

import type { IRComponent } from "@openapi-xcgen/core";
import { toTypeName } from "../../helpers/naming";
import { irTypeToTsType } from "../../helpers/type-mapper";

/**
 * IRMapSchemaからTypeScript type aliasを生成
 * @param model - IRMapSchema
 * @returns TypeScript Record type alias定義文字列
 *
 * @example
 * ```typescript
 * const model: IRComponent = {
 *   kind: "map",
 *   name: "UserMap",
 *   referencePath: "#/components/schemas/UserMap",
 *   valueType: { kind: "ref", referencePath: "User", referencePath: "#/components/schemas/User" },
 * };
 * generateMapType(model);
 * // => "export type UserMap = Record<string, User>;"
 * ```
 */
export function generateMapType(model: IRComponent & { kind: "map" }): string {
  const typeName = toTypeName(model.name);
  const valueType = irTypeToTsType(model.valueType);

  const lines: string[] = [];

  if (model.description) {
    lines.push("/**");
    lines.push(` * ${model.description}`);
    lines.push(" */");
  }

  lines.push(`export type ${typeName} = Record<string, ${valueType}>;`);

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("types-map", () => {
    describe("generateMapType", () => {
      it("should generate basic map type", () => {
        const model: IRComponent & { kind: "map" } = {
          kind: "map",
          name: "NumberMap",
          referencePath: "#/components/schemas/NumberMap",
          valueType: "int",
        };

        const result = generateMapType(model);

        expect(result).toEqual(
          "export type NumberMap = Record<string, number>;",
        );
      });

      it("should generate map with description", () => {
        const model: IRComponent & { kind: "map" } = {
          kind: "map",
          name: "StringMap",
          referencePath: "#/components/schemas/StringMap",
          description: "Map of strings",
          valueType: "string",
        };

        const result = generateMapType(model);

        expect(result).toEqual(
          `
/**
 * Map of strings
 */
export type StringMap = Record<string, string>;
`.trim(),
        );
      });

      it("should generate map of reference type", () => {
        const model: IRComponent & { kind: "map" } = {
          kind: "map",
          name: "UserMap",
          referencePath: "#/components/schemas/UserMap",
          valueType: {
            kind: "ref",
            referencePath: "User",
          },
        };

        const result = generateMapType(model);

        expect(result).toEqual("export type UserMap = Record<string, User>;");
      });
    });
  });
}
