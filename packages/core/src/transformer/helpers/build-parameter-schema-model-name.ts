/**
 * パラメータinline schema用のモデル名を生成
 *
 * パラメータのschema（enum, array, objectなど）が独立したモデルとして抽出される際の名前を生成します。
 * 命名規則: {Method}{Path}Params{ParameterName}
 */

import { pascalCase } from "es-toolkit/string";
import type { ParameterContext } from "../types";
import { pathToComponentBase } from "./path-to-component-base";

/**
 * パラメータinline schema用のモデル名を生成
 *
 * パラメータのschema（enum, array, objectなど）が独立したモデルとして抽出される際の名前を生成します。
 * 命名規則: {Method}{Path}Params{ParameterName}
 *
 * @param context - ParameterContext
 * @returns モデル名（例: "GetUsersIdParamsCategory", "PostUsersParamsLimit"）
 *
 * @example
 * ```typescript
 * // context = { method: "get", pathTemplate: "/users/{id}", parameterName: "category" }
 * buildParameterSchemaModelName(context)
 * // => "GetUsersIdParamsCategory"
 *
 * // context = { method: "post", pathTemplate: "/users", parameterName: "limit" }
 * buildParameterSchemaModelName(context)
 * // => "PostUsersParamsLimit"
 * ```
 */
export function buildParameterSchemaModelName(
  context: ParameterContext,
): string {
  const methodPascal = pascalCase(context.method ?? "");
  const pathBase = pathToComponentBase(context.pathTemplate ?? "");
  const paramNamePascal = pascalCase(context.parameterName);
  return `${methodPascal}${pathBase}Params${paramNamePascal}`;
}
