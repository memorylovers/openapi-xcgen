import { pascalCase } from "es-toolkit/string";
import type { PathsResponseContext } from "../../types";
import { getMediaTypeSuffix } from "./media-type-suffix";
import { parseResponsePath } from "../path/parse-document-path";
import { pathToComponentBase } from "./path-to-component-base";

/**
 * Responseのモデル名を生成（paths配下）
 *
 * @param context - PathsResponseContext
 * @returns モデル名（例: "GetUsers200Response"）
 *
 * @example
 * ```typescript
 * // context = { documentPath: ["paths", "/users", "get", "responses", "200"], ... }
 * buildResponseModelName(context)  // => "GetUsers200Response"
 * ```
 */
export function buildResponseModelName(context: PathsResponseContext): string {
  const parsed = parseResponsePath(context.documentPath);
  if (!parsed) {
    throw new Error(
      `Failed to parse response path: ${context.documentPath.join("/")}`,
    );
  }

  const methodPascal = pascalCase(parsed.method);
  const pathBase = pathToComponentBase(parsed.pathTemplate);
  const mediaSuffix = getMediaTypeSuffix(context.contentType ?? undefined);
  return `${methodPascal}${pathBase}${parsed.statusCode}${mediaSuffix}Response`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildResponseModelName", () => {
    it("should build model name for 200 response", () => {
      const context: PathsResponseContext = {
        kind: "response",
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
        contentType: "application/json",
        schemaPath: ["content", "application/json", "schema"],
      };
      expect(buildResponseModelName(context)).toBe("GetUsers200Response");
    });

    it("should build model name for 404 response", () => {
      const context: PathsResponseContext = {
        kind: "response",
        documentPath: ["paths", "/users/{id}", "get", "responses", "404"],
        rootSegment: "paths",
        contentType: "application/json",
        schemaPath: ["content", "application/json", "schema"],
      };
      expect(buildResponseModelName(context)).toBe("GetUsersId404Response");
    });
  });
}
