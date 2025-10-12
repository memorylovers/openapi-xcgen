/**
 * TypeScript AllOf型生成
 *
 * IRAllOfModelからTypeScriptのintersection typeを生成する
 */

import type { IRModel } from "@openapi-xcgen/core";
import { toTypeName } from "../../helpers/naming.js";
import { irTypeToTsType } from "../../helpers/type-mapper.js";

/**
 * IRAllOfModelからTypeScript intersection typeを生成
 * @param model - IRAllOfModel
 * @returns TypeScript intersection type定義文字列
 *
 * @example
 * ```typescript
 * const model: IRModel = {
 *   kind: "allOf",
 *   name: "Admin",
 *   referencePath: "#/components/schemas/Admin",
 *   schemas: [
 *     { kind: "ref", name: "User", referencePath: "#/components/schemas/User" },
 *     { kind: "ref", name: "Permissions", referencePath: "#/components/schemas/Permissions" }
 *   ],
 * };
 * generateAllOfType(model);
 * // => "export type Admin = User & Permissions;"
 * ```
 */
export function generateAllOfType(model: IRModel & { kind: "allOf" }): string {
  const typeName = toTypeName(model.name);
  const types = model.schemas.map((schema) => irTypeToTsType(schema));

  const lines: string[] = [];

  if (model.description) {
    lines.push("/**");
    lines.push(` * ${model.description}`);
    lines.push(" */");
  }

  lines.push(`export type ${typeName} = ${types.join(" & ")};`);

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("types-allof", () => {
    describe("generateAllOfType", () => {
      it("should generate basic allOf type", () => {
        const model: IRModel & { kind: "allOf" } = {
          kind: "allOf",
          name: "Admin",
          referencePath: "#/components/schemas/Admin",
          schemas: [
            {
              kind: "ref",
              name: "User",
            },
            {
              kind: "ref",
              name: "Permissions",
            },
          ],
        };

        const result = generateAllOfType(model);

        expect(result).toEqual("export type Admin = User & Permissions;");
      });

      it("should generate allOf with description", () => {
        const model: IRModel & { kind: "allOf" } = {
          kind: "allOf",
          name: "SuperUser",
          referencePath: "#/components/schemas/SuperUser",
          description: "User with super permissions",
          schemas: [
            {
              kind: "ref",
              name: "User",
            },
            {
              kind: "ref",
              name: "SuperPermissions",
            },
          ],
        };

        const result = generateAllOfType(model);

        expect(result).toEqual(
          `
/**
 * User with super permissions
 */
export type SuperUser = User & SuperPermissions;
`.trim(),
        );
      });

      it("should generate allOf with multiple schemas", () => {
        const model: IRModel & { kind: "allOf" } = {
          kind: "allOf",
          name: "FullAccess",
          referencePath: "#/components/schemas/FullAccess",
          schemas: [
            {
              kind: "ref",
              name: "User",
            },
            {
              kind: "ref",
              name: "Admin",
            },
            {
              kind: "ref",
              name: "Owner",
            },
          ],
        };

        const result = generateAllOfType(model);

        expect(result).toEqual(
          "export type FullAccess = User & Admin & Owner;",
        );
      });
    });
  });
}
