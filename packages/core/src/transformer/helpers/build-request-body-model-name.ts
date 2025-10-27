import { pascalCase } from "es-toolkit/string";
import type { PathsRequestBodyContext } from "../types";
import { getMediaTypeSuffix } from "./media-type-suffix";
import { pathToComponentBase } from "./path-to-component-base";

/**
 * RequestBodyのモデル名を生成（paths配下）
 *
 * @param context - PathsRequestBodyContext
 * @returns モデル名（例: "PostUsersRequestBody"）
 *
 * @example
 * ```typescript
 * // context = { method: "post", pathTemplate: "/users", ... }
 * buildRequestBodyModelName(context)  // => "PostUsersRequestBody"
 * ```
 */
export function buildRequestBodyModelName(
  context: PathsRequestBodyContext,
): string {
  const methodPascal = pascalCase(context.method ?? "");
  const pathBase = pathToComponentBase(context.pathTemplate ?? "");
  const mediaSuffix = getMediaTypeSuffix(context.contentType ?? undefined);
  return `${methodPascal}${pathBase}${mediaSuffix}RequestBody`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildRequestBodyModelName", () => {
    it("should build model name for request body", () => {
      const context: PathsRequestBodyContext = {
        kind: "requestBody",
        documentPath: ["paths", "/users", "post", "requestBody"],
        rootSegment: "paths",
        method: "post",
        pathTemplate: "/users",
        contentType: "application/json",
        schemaPath: ["content", "application/json", "schema"],
      };
      expect(buildRequestBodyModelName(context)).toBe("PostUsersRequestBody");
    });

    it("should build model name with media type suffix", () => {
      const context: PathsRequestBodyContext = {
        kind: "requestBody",
        documentPath: ["paths", "/files", "post", "requestBody"],
        rootSegment: "paths",
        method: "post",
        pathTemplate: "/files",
        contentType: "multipart/form-data",
        schemaPath: ["content", "multipart/form-data", "schema"],
      };
      expect(buildRequestBodyModelName(context)).toBe(
        "PostFilesMultipartFormDataRequestBody",
      );
    });
  });
}
