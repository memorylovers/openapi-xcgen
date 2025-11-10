/**
 * パラメータinline schema用のコンポーネント名を生成
 *
 * パラメータのschema（enum, array, objectなど）が独立したモデルとして抽出される際の名前を生成します。
 * 命名規則: {Method}{Path}Params{ParameterName}
 */

import { pascalCase } from "es-toolkit/string";
import type { ParameterContext } from "../../types";
import { buildParameterComponentName } from "./build-parameter-component-name";

/**
 * パラメータinline schema用のコンポーネント名を生成
 *
 * パラメータのschema（enum, array, objectなど）が独立したモデルとして抽出される際の名前を生成します。
 * 命名規則: {Method}{Path}Params{ParameterName}
 *
 * @param context - ParameterContext
 * @returns コンポーネント名（例: "GetUsersIdParamsCategory", "PostUsersParamsLimit"）
 *
 * @example
 * ```typescript
 * buildParameterSchemaComponentName(context)
 * // => "GetUsersIdParamsCategory"
 *
 * buildParameterSchemaComponentName(context)
 * // => "PostUsersParamsLimit"
 * ```
 */
export function buildParameterSchemaComponentName(
  context: ParameterContext,
): string {
  const paramBase = buildParameterComponentName(context);
  const paramNamePascal = pascalCase(context.parameterName);
  return `${paramBase}${paramNamePascal}`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildParameterSchemaComponentName", () => {
    it("should build model name for path parameter", () => {
      const context: ParameterContext = {
        kind: "parameter",
        documentPath: ["paths", "/users/{id}", "get", "parameters"],
        parameterName: "id",
        in: "path",
        rootSegment: "paths",
      };
      expect(buildParameterSchemaComponentName(context)).toBe(
        "GetUsersIdParamsId",
      );
    });

    it("should build model name for query parameter", () => {
      const context: ParameterContext = {
        kind: "parameter",
        documentPath: ["paths", "/users", "get", "parameters"],
        parameterName: "category",
        in: "query",
        rootSegment: "paths",
      };
      expect(buildParameterSchemaComponentName(context)).toBe(
        "GetUsersParamsCategory",
      );
    });

    it("should build model name for complex path template", () => {
      const context: ParameterContext = {
        kind: "parameter",
        documentPath: [
          "paths",
          "/api/v2/users/{userId}/posts",
          "post",
          "parameters",
        ],
        parameterName: "limit",
        in: "query",
        rootSegment: "paths",
      };
      expect(buildParameterSchemaComponentName(context)).toBe(
        "PostApiV2UsersUserIdPostsParamsLimit",
      );
    });

    it("should handle header parameter", () => {
      const context: ParameterContext = {
        kind: "parameter",
        documentPath: ["paths", "/posts", "get", "parameters"],
        parameterName: "x-api-key",
        in: "header",
        rootSegment: "paths",
      };
      expect(buildParameterSchemaComponentName(context)).toBe(
        "GetPostsParamsXApiKey",
      );
    });

    it("should handle cookie parameter", () => {
      const context: ParameterContext = {
        kind: "parameter",
        documentPath: ["paths", "/session", "get", "parameters"],
        parameterName: "session_id",
        in: "cookie",
        rootSegment: "paths",
      };
      expect(buildParameterSchemaComponentName(context)).toBe(
        "GetSessionParamsSessionId",
      );
    });
  });
}
