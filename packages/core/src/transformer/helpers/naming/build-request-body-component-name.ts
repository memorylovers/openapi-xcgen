import { consola } from "consola";
import { pascalCase } from "es-toolkit/string";
import type { PathsRequestBodyContext } from "../../types";
import { getMediaTypeSuffix } from "./media-type-suffix";
import { parseRequestBodyPath } from "../path/parse-document-path";
import { pathToComponentBase } from "./path-to-component-base";

/**
 * RequestBodyのコンポーネント名を生成（paths配下）
 *
 * @param context - PathsRequestBodyContext
 * @returns コンポーネント名（例: "PostUsersRequestBody"）
 *
 * @example
 * ```typescript
 * // context = { documentPath: ["paths", "/users", "post", "requestBody"], ... }
 * buildRequestBodyComponentName(context)  // => "PostUsersRequestBody"
 * ```
 */
export function buildRequestBodyComponentName(
  context: PathsRequestBodyContext,
): string {
  const parsed = parseRequestBodyPath(context.documentPath);
  if (!parsed) {
    consola.warn(
      `Invalid request body path: ${context.documentPath.join("/")}`,
    );
    // Fallback: use last element of documentPath
    return context.documentPath.at(-1) ?? "UnknownRequestBody";
  }

  const methodPascal = pascalCase(parsed.method);
  const pathBase = pathToComponentBase(parsed.pathTemplate);
  const mediaSuffix = getMediaTypeSuffix(context.contentType ?? undefined);
  return `${methodPascal}${pathBase}${mediaSuffix}RequestBody`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildRequestBodyComponentName", () => {
    it("should build model name for request body", () => {
      const context: PathsRequestBodyContext = {
        kind: "requestBody",
        documentPath: ["paths", "/users", "post", "requestBody"],
        rootSegment: "paths",
        contentType: "application/json",
        schemaPath: ["content", "application/json", "schema"],
      };
      expect(buildRequestBodyComponentName(context)).toBe(
        "PostUsersRequestBody",
      );
    });

    it("should build model name with media type suffix", () => {
      const context: PathsRequestBodyContext = {
        kind: "requestBody",
        documentPath: ["paths", "/files", "post", "requestBody"],
        rootSegment: "paths",
        contentType: "multipart/form-data",
        schemaPath: ["content", "multipart/form-data", "schema"],
      };
      expect(buildRequestBodyComponentName(context)).toBe(
        "PostFilesMultipartFormDataRequestBody",
      );
    });
  });
}
