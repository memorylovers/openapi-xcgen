/**
 * TypeScript Array型生成
 *
 * IRArrayModelからTypeScriptのArray type aliasを生成する
 */

import type { IRModel } from "@openapi-xcgen/core";
import { toTypeName } from "../../helpers/naming";
import { irTypeToTsType } from "../../helpers/type-mapper";

/**
 * IRArrayModelからTypeScript type aliasを生成
 * @param model - IRArrayModel
 * @returns TypeScript Array type alias定義文字列
 *
 * @example
 * ```typescript
 * const model: IRModel = {
 *   kind: "array",
 *   name: "UserList",
 *   referencePath: "#/components/schemas/UserList",
 *   itemType: { kind: "ref", name: "User", referencePath: "#/components/schemas/User" },
 * };
 * generateArrayType(model);
 * // => "export type UserList = Array<User>;"
 * ```
 */
export function generateArrayType(model: IRModel & { kind: "array" }): string {
  const typeName = toTypeName(model.name);
  const itemType = irTypeToTsType(model.itemType);

  const lines: string[] = [];

  if (model.description) {
    lines.push("/**");
    lines.push(` * ${model.description}`);
    lines.push(" */");
  }

  lines.push(`export type ${typeName} = Array<${itemType}>;`);

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("types-array", () => {
    describe("generateArrayType", () => {
      it("should generate basic array type", () => {
        const model: IRModel & { kind: "array" } = {
          kind: "array",
          name: "NumberList",
          referencePath: "#/components/schemas/NumberList",
          itemType: "int",
        };

        const result = generateArrayType(model);

        expect(result).toEqual("export type NumberList = Array<number>;");
      });

      it("should generate array with description", () => {
        const model: IRModel & { kind: "array" } = {
          kind: "array",
          name: "StringList",
          referencePath: "#/components/schemas/StringList",
          description: "List of strings",
          itemType: "string",
        };

        const result = generateArrayType(model);

        expect(result).toEqual(
          `
/**
 * List of strings
 */
export type StringList = Array<string>;
`.trim(),
        );
      });

      it("should generate array of reference type", () => {
        const model: IRModel & { kind: "array" } = {
          kind: "array",
          name: "UserList",
          referencePath: "#/components/schemas/UserList",
          itemType: {
            kind: "ref",
            name: "User",
          },
        };

        const result = generateArrayType(model);

        expect(result).toEqual("export type UserList = Array<User>;");
      });
    });
  });
}
