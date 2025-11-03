/**
 * TypeScript Parameter型生成
 *
 * IRParameterComponentからTypeScriptのinterfaceを生成する
 * {OperationId}Data形式で、path/query/header/bodyを構造化
 */

import type { IRParameterComponent } from "@openapi-xcgen/core";
import { toTypeName } from "../../helpers/naming";
import type { HookableInstance } from "../../hooks";
import { generateParameterProperty } from "./types-parameter-property";

/**
 * IRParameterComponentからTypeScript interfaceを生成
 * @param model - IRParameterComponent
 * @param hooks - Hook instance（オプション）
 * @returns TypeScript interface定義文字列
 *
 * @example
 * ```typescript
 * const model: IRParameterComponent = {
 *   kind: "parameter",
 *   name: "GetUserData",
 *   referencePath: "#/paths/~1users~1{id}/get/parameters",
 *   properties: [
 *     { name: "id", type: "int", required: true, in: "path" },
 *     { name: "include", type: "string", required: false, in: "query" }
 *   ],
 * };
 * await generateParameterType(model);
 * // => "export interface GetUserData { path: { id: number; }; query: { include?: string; }; }"
 * ```
 */
export function generateParameterType(
  model: IRParameterComponent,
  hooks?: HookableInstance,
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
      const propertyCode = generateParameterProperty(param, undefined, hooks);
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
        const model: IRParameterComponent = {
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
        const model: IRParameterComponent = {
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
        const model: IRParameterComponent = {
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
