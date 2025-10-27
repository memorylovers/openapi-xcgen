import { pascalCase } from "es-toolkit/string";
import type { ParameterContext } from "../../types";
import { pathToComponentBase } from "./path-to-component-base";
import { parseParameterPath } from "../path/parse-document-path";

/**
 * パラメータのモデル名を生成
 *
 * @param context - ParameterContext
 * @returns モデル名（例: "GetUsersIdParams"）
 *
 * @example
 * ```typescript
 * // context = { documentPath: ["paths", "/users/{id}", "get", "parameters"], ... }
 * buildParameterModelName(context)  // => "GetUsersIdParams"
 * ```
 */
export function buildParameterModelName(context: ParameterContext): string {
  const parsed = parseParameterPath(context.documentPath);
  if (!parsed) {
    throw new Error(
      `Failed to parse parameter path: ${context.documentPath.join("/")}`,
    );
  }

  const methodPascal = pascalCase(parsed.method);
  const pathBase = pathToComponentBase(parsed.pathTemplate);
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
        rootSegment: "paths",
      };
      expect(buildParameterModelName(context)).toBe("GetUsersParams");
    });
  });
}
