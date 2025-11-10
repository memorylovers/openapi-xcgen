/**
 * TypeScript Object型生成
 *
 * IRObjectSchemaからTypeScriptのinterfaceを生成する
 */

import type { IRComponent, IRProperty } from "@openapi-xcgen/core";
import { toTypeName } from "../../helpers/naming";
import { irTypeToTsType } from "../../helpers/type-mapper";
import type { TypeGenerationContext } from "./generation-context";
import { generateProperty } from "./types-property";

/**
 * IRObjectSchemaからTypeScript interfaceを生成
 * @param model - IRObjectSchema (properties を持つモデル)
 * @param ctx - Type generation context
 * @returns TypeScript interface定義文字列
 *
 * @example
 * ```typescript
 * const model: IRComponent = {
 *   kind: "object",
 *   name: "User",
 *   referencePath: "#/components/schemas/User",
 *   properties: [
 *     { name: "email", type: "string", required: true }
 *   ],
 * };
 * generateObjectType(model, ctx);
 * // => "export interface User { ... }"
 * ```
 */
export function generateObjectType(
  model: IRComponent & { properties: IRProperty[] },
  ctx: TypeGenerationContext,
): string {
  const lines: string[] = [];
  const typeName = toTypeName(model.name);

  // JSDocコメント
  if (model.description) {
    lines.push("/**");
    lines.push(` * ${model.description}`);
    lines.push(" */");
  }

  // interface定義
  lines.push(`export interface ${typeName} {`);

  // プロパティ生成
  for (const prop of model.properties) {
    const propertyCode = generateProperty(prop, model, ctx);
    lines.push(`  ${propertyCode}`);
  }

  // additionalPropertiesがある場合
  if ("additionalProperties" in model && model.additionalProperties) {
    const valueType = irTypeToTsType(model.additionalProperties);
    lines.push(`  [key: string]: ${valueType};`);
  }

  lines.push("}");

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const mockCtx: TypeGenerationContext = {
    ir: {
      metadata: { title: "Test API", version: "1.0.0" },
      components: [],
      tags: [],
      endpoints: [],
    },
  };
  const { describe, it, expect } = import.meta.vitest;

  describe("types-object", () => {
    describe("generateObjectType", () => {
      it("should generate basic object type", () => {
        const model: IRComponent = {
          kind: "object",
          name: "User",
          referencePath: "#/components/schemas/User",
          properties: [
            {
              name: "id",
              type: "int",
              required: true,
            },
            {
              name: "email",
              type: "string",
              required: true,
            },
          ],
        };

        const result = generateObjectType(model, mockCtx);

        expect(result).toEqual(
          `
export interface User {
  id: number;
  email: string;
}
`.trim(),
        );
      });

      it("should generate object with description", () => {
        const model: IRComponent = {
          kind: "object",
          name: "User",
          referencePath: "#/components/schemas/User",
          description: "User account information",
          properties: [
            {
              name: "name",
              type: "string",
              required: true,
            },
          ],
        };

        const result = generateObjectType(model, mockCtx);

        expect(result).toEqual(
          `
/**
 * User account information
 */
export interface User {
  name: string;
}
`.trim(),
        );
      });

      it("should generate object with additionalProperties", () => {
        const model: IRComponent = {
          kind: "object",
          name: "Config",
          referencePath: "#/components/schemas/Config",
          properties: [
            {
              name: "version",
              type: "string",
              required: true,
            },
          ],
          additionalProperties: "string",
        };

        const result = generateObjectType(model, mockCtx);

        expect(result).toEqual(
          `
export interface Config {
  version: string;
  [key: string]: string;
}
`.trim(),
        );
      });

      it("should generate object with optional properties", () => {
        const model: IRComponent = {
          kind: "object",
          name: "Profile",
          referencePath: "#/components/schemas/Profile",
          properties: [
            {
              name: "name",
              type: "string",
              required: true,
            },
            {
              name: "bio",
              type: "string",
            },
          ],
        };

        const result = generateObjectType(model, mockCtx);

        expect(result).toEqual(
          `
export interface Profile {
  name: string;
  bio?: string | undefined;
}
`.trim(),
        );
      });
    });
  });
}
