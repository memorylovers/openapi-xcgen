import { pascalCase } from "es-toolkit/string";
import type { ParameterContext } from "../types";
import { pathToComponentBase } from "./path-to-component-base";

/**
 * パラメータのモデル名を生成
 *
 * @param context - ParameterContext
 * @returns モデル名（例: "GetUsersIdParams"）
 *
 * @example
 * ```typescript
 * // context = { method: "get", pathTemplate: "/users/{id}", ... }
 * buildParameterModelName(context)  // => "GetUsersIdParams"
 * ```
 */
export function buildParameterModelName(context: ParameterContext): string {
  const methodPascal = pascalCase(context.method ?? "");
  const pathBase = pathToComponentBase(context.pathTemplate ?? "");
  return `${methodPascal}${pathBase}Params`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildParameterModelName", () => {
    it("should build model name for path parameter", () => {
      const context: ParameterContext = {
        kind: "parameter",
        documentPath: ["paths", "/users/{id}", "get", "parameters"],
        parameterName: "id",
        in: "path",
        method: "get",
        pathTemplate: "/users/{id}",
        rootSegment: "paths",
      };
      expect(buildParameterModelName(context)).toBe("GetUsersIdParams");
    });

    it("should build model name for query parameter", () => {
      const context: ParameterContext = {
        kind: "parameter",
        documentPath: ["paths", "/users", "get", "parameters"],
        parameterName: "limit",
        in: "query",
        method: "get",
        pathTemplate: "/users",
        rootSegment: "paths",
      };
      expect(buildParameterModelName(context)).toBe("GetUsersParams");
    });
  });
}
