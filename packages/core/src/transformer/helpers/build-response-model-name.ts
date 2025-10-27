import { pascalCase } from "es-toolkit/string";
import type { PathsResponseContext } from "../types";
import { getMediaTypeSuffix } from "./media-type-suffix";
import { pathToComponentBase } from "./path-to-component-base";

/**
 * Responseのモデル名を生成（paths配下）
 *
 * @param context - PathsResponseContext
 * @returns モデル名（例: "GetUsers200Response"）
 *
 * @example
 * ```typescript
 * // context = { method: "get", pathTemplate: "/users", statusCode: "200", ... }
 * buildResponseModelName(context)  // => "GetUsers200Response"
 * ```
 */
export function buildResponseModelName(context: PathsResponseContext): string {
  const methodPascal = pascalCase(context.method ?? "");
  const pathBase = pathToComponentBase(context.pathTemplate ?? "");
  const mediaSuffix = getMediaTypeSuffix(context.contentType ?? undefined);
  return `${methodPascal}${pathBase}${context.statusCode}${mediaSuffix}Response`;
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
        method: "get",
        pathTemplate: "/users",
        statusCode: "200",
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
        method: "get",
        pathTemplate: "/users/{id}",
        statusCode: "404",
        contentType: "application/json",
        schemaPath: ["content", "application/json", "schema"],
      };
      expect(buildResponseModelName(context)).toBe("GetUsersId404Response");
    });
  });
}
