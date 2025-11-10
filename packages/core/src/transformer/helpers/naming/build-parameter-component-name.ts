import { consola } from "consola";
import { pascalCase } from "es-toolkit/string";
import type { ParameterContext } from "../../types";
import { pathToComponentBase } from "./path-to-component-base";
import { parseParameterPath } from "../path/parse-document-path";

/**
 * パラメータのコンポーネント名を生成
 *
 * @param context - ParameterContext
 * @returns コンポーネント名（例: "GetUsersIdParams"）
 *
 * @example
 * ```typescript
 * // context = { documentPath: ["paths", "/users/{id}", "get", "parameters"], ... }
 * buildParameterComponentName(context)  // => "GetUsersIdParams"
 * ```
 */
export function buildParameterComponentName(context: ParameterContext): string {
  const parsed = parseParameterPath(context.documentPath);
  if (!parsed) {
    consola.warn(`Invalid parameter path: ${context.documentPath.join("/")}`);
    // Fallback: use last element of documentPath
    return context.documentPath.at(-1) ?? "UnknownParams";
  }

  const methodPascal = pascalCase(parsed.method);
  const pathBase = pathToComponentBase(parsed.pathTemplate);
  return `${methodPascal}${pathBase}Params`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildParameterComponentName", () => {
    it("should build component name for path parameter", () => {
      const context: ParameterContext = {
        kind: "parameter",
        documentPath: ["paths", "/users/{id}", "get", "parameters"],
        parameterName: "id",
        in: "path",
        rootSegment: "paths",
      };
      expect(buildParameterComponentName(context)).toBe("GetUsersIdParams");
    });

    it("should build component name for query parameter", () => {
      const context: ParameterContext = {
        kind: "parameter",
        documentPath: ["paths", "/users", "get", "parameters"],
        parameterName: "limit",
        in: "query",
        rootSegment: "paths",
      };
      expect(buildParameterComponentName(context)).toBe("GetUsersParams");
    });
  });
}
