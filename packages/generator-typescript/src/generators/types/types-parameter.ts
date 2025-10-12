/**
 * TypeScript Parameter型生成
 *
 * IRParameterModelからTypeScriptのinterfaceを生成する
 * {OperationId}Data形式で、path/query/header/bodyを構造化
 */

import type { IRModel } from "@openapi-xcgen/core";
import { toTypeName } from "../../helpers/naming.js";
import { generateProperty } from "./types-property.js";

/**
 * IRParameterModelからTypeScript interfaceを生成
 * @param model - IRParameterModel
 * @returns TypeScript interface定義文字列
 *
 * @example
 * ```typescript
 * const model: IRModel = {
 *   kind: "parameter",
 *   name: "GetUserData",
 *   referencePath: "#/paths/~1users~1{id}/get/parameters",
 *   properties: [
 *     { name: "id", type: "int", required: true, in: "path" },
 *     { name: "include", type: "string", required: false, in: "query" }
 *   ],
 * };
 * generateParameterType(model);
 * // => "export interface GetUserData { path: { id: number; }; query: { include?: string; }; }"
 * ```
 */
export function generateParameterType(
  model: IRModel & { kind: "parameter" },
): string {
  const lines: string[] = [];
  const typeName = toTypeName(model.name);

  if (model.description) {
    lines.push("/**");
    lines.push(` * ${model.description}`);
    lines.push(" */");
  }

  lines.push(`export interface ${typeName} {`);

  // パラメータをin別にグループ化
  const grouped: Record<string, typeof model.properties> = {};
  for (const param of model.properties) {
    const inType = param.in;
    if (!grouped[inType]) {
      grouped[inType] = [];
    }
    grouped[inType].push(param);
  }

  // 各in typeごとにネストしたオブジェクト型を生成
  for (const [inType, params] of Object.entries(grouped)) {
    lines.push(`  ${inType}: {`);
    for (const param of params) {
      const propertyCode = generateProperty(param);
      lines.push(`    ${propertyCode}`);
    }
    lines.push(`  };`);
  }

  lines.push("}");

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("types-parameter", () => {
    describe("generateParameterType", () => {
      it("should generate parameter type with path params", () => {
        const model: IRModel & { kind: "parameter" } = {
          kind: "parameter",
          name: "GetUserData",
          referencePath: "#/paths/~1users~1{id}/get/parameters",
          properties: [
            {
              name: "id",
              type: "int",
              required: true,
              in: "path",
            },
          ],
        };

        const result = generateParameterType(model);

        expect(result).toEqual(
          `
export interface GetUserData {
  path: {
    id: number;
  };
}
`.trim(),
        );
      });

      it("should generate parameter type with multiple groups", () => {
        const model: IRModel & { kind: "parameter" } = {
          kind: "parameter",
          name: "SearchData",
          referencePath: "#/paths/~1search/get/parameters",
          properties: [
            {
              name: "q",
              type: "string",
              required: true,
              in: "query",
            },
            {
              name: "limit",
              type: "int",
              in: "query",
            },
          ],
        };

        const result = generateParameterType(model);

        expect(result).toEqual(
          `
export interface SearchData {
  query: {
    q: string;
    limit?: number | undefined;
  };
}
`.trim(),
        );
      });

      it("should generate parameter type with description", () => {
        const model: IRModel & { kind: "parameter" } = {
          kind: "parameter",
          name: "UpdateUserData",
          referencePath: "#/paths/~1users~1{id}/put/parameters",
          description: "Parameters for updating a user",
          properties: [
            {
              name: "id",
              type: "int",
              required: true,
              in: "path",
            },
          ],
        };

        const result = generateParameterType(model);

        expect(result).toEqual(
          `
/**
 * Parameters for updating a user
 */
export interface UpdateUserData {
  path: {
    id: number;
  };
}
`.trim(),
        );
      });
    });
  });
}
