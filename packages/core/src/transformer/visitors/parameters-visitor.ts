/**
 * parameters-visitor.ts - Parameters配列をIRParameterとIRModelに変換
 *
 * OpenAPIのParameters配列を処理し、個別のIRParameterと
 * 統合されたパラメータモデルに変換する。
 *
 * 責務:
 * - Parameters配列の反復処理
 * - 個別パラメータのvisitParameter委譲
 * - $ref参照パラメータの警告とスキップ
 * - パラメータ統合モデルの生成（createParameterModel委譲）
 */

import { consola } from "consola";
import { isReferenceObject } from "../../types/guards";
import type { ParameterObject, ReferenceObject } from "../../types";
import type { IRModel, IRParameter, IRParameterModel } from "../../types/ir";
import { createParameterModel } from "../helpers/create-parameter-model";
import type { ParameterContext, ParametersContext } from "../types";
import { visitParameter } from "./parameter-visitor";

/**
 * Parameters処理の結果
 */
export interface ParametersResult {
  /** 個別のパラメータ配列 */
  parameters: IRParameter[];
  /** パラメータ統合モデル（パラメータがない場合はnull） */
  unifiedModel: IRParameterModel | null;
  /** インラインスキーマから抽出されたモデル（オブジェクト、列挙型、配列、マップを統一） */
  models: IRModel[];
}

/**
 * Parameters配列をIRParameterとパラメータ統合モデルに変換
 *
 * @param parameters - OpenAPIのParameters配列
 * @param context - Parameters用コンテキスト
 * @returns ParametersResult
 *
 * @example OpenAPI YAML
 * ```yaml
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *   - name: limit
 *     in: query
 *     schema:
 *       type: integer
 *       default: 10
 * ```
 */
export function visitParameters(
  parameters: (ParameterObject | ReferenceObject)[] | null,
  context: ParametersContext,
): ParametersResult {
  const irParameters: IRParameter[] = [];
  const models: IRModel[] = [];

  // パラメータ配列が存在しない場合
  if (!parameters || parameters.length === 0) {
    return {
      parameters: [],
      unifiedModel: null,
      models: [],
    };
  }

  // 各パラメータを処理
  for (let i = 0; i < parameters.length; i++) {
    const param = parameters[i];

    if (isReferenceObject(param)) {
      consola.warn(`Reference parameter not supported yet: ${param.$ref}`);
      continue;
    }

    const paramContext: ParameterContext = {
      documentPath: [...context.documentPath, "parameters", param.name],
      parameterName: param.name,
      in: param.in as "path" | "query" | "header" | "cookie",
      method: context.method,
      pathTemplate: context.pathTemplate,
      rootSegment: "paths",
    };
    const irParam = visitParameter(param, paramContext);

    if (irParam) {
      irParameters.push(irParam);
    }
  }

  // パラメータ統合モデル生成
  const unifiedModel = createParameterModel(
    irParameters,
    context.pathTemplate,
    context.method,
    context.documentPath,
  );

  return {
    parameters: irParameters,
    unifiedModel,
    models,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitParameters", () => {
    it("should return empty result for null parameters", () => {
      const result = visitParameters(null, {
        documentPath: ["paths", "/test", "get"],
        rootSegment: "paths",
        method: "get",
        pathTemplate: "/test",
      });

      expect(result).toEqual({
        parameters: [],
        unifiedModel: null,
        models: [],
      });
    });

    it("should return empty result for empty parameters array", () => {
      const result = visitParameters([], {
        documentPath: ["paths", "/test", "get"],
        rootSegment: "paths",
        method: "get",
        pathTemplate: "/test",
      });

      expect(result).toEqual({
        parameters: [],
        unifiedModel: null,
        models: [],
      });
    });

    it("should process single parameter", () => {
      const parameters = [
        {
          name: "id",
          in: "path" as const,
          required: true,
          schema: { type: "string" },
          description: "User ID",
        } as ParameterObject,
      ];

      const result = visitParameters(parameters, {
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths",
        method: "get",
        pathTemplate: "/users/{id}",
      });

      expect(result).toEqual({
        parameters: [
          {
            name: "id",
            description: "User ID",
            type: "string",
            required: true,
            nullable: null,
            defaultValue: null,
            deprecated: null,
            in: "path",
          },
        ],
        unifiedModel: {
          kind: "parameter",
          name: "GetUsersParams",
          description: "Parameters for GET /users/{id}\nid: User ID",
          properties: [
            {
              name: "id",
              description: "User ID",
              type: "string",
              required: true,
              nullable: null,
              defaultValue: null,
              deprecated: null,
              validation: null,
              in: "path",
            },
          ],
          referencePath: "#/paths/::users::{id}/get/GetUsersParams",
        },
        models: [],
      });
    });

    it("should process multiple parameters", () => {
      const parameters = [
        {
          name: "id",
          in: "path" as const,
          required: true,
          schema: { type: "string" },
        } as ParameterObject,
        {
          name: "limit",
          in: "query" as const,
          required: false,
          schema: { type: "integer", default: 10 },
        } as ParameterObject,
        {
          name: "offset",
          in: "query" as const,
          required: false,
          schema: { type: "integer" },
        } as ParameterObject,
      ];

      const result = visitParameters(parameters, {
        documentPath: ["paths", "/users/{id}/posts", "get"],
        rootSegment: "paths",
        method: "get",
        pathTemplate: "/users/{id}/posts",
      });

      expect(result).toEqual({
        parameters: [
          {
            name: "id",
            description: null,
            type: "string",
            required: true,
            nullable: null,
            defaultValue: null,
            deprecated: null,
            in: "path",
          },
          {
            name: "limit",
            description: null,
            type: "int",
            required: false,
            nullable: null,
            defaultValue: 10,
            deprecated: null,
            in: "query",
          },
          {
            name: "offset",
            description: null,
            type: "int",
            required: false,
            nullable: null,
            defaultValue: null,
            deprecated: null,
            in: "query",
          },
        ],
        unifiedModel: {
          kind: "parameter",
          name: "GetUsersPostsParams",
          description: "Parameters for GET /users/{id}/posts",
          properties: [
            {
              name: "id",
              description: null,
              type: "string",
              required: true,
              nullable: null,
              defaultValue: null,
              deprecated: null,
              validation: null,
              in: "path",
            },
            {
              name: "limit",
              description: null,
              type: "int",
              required: false,
              nullable: null,
              defaultValue: 10,
              deprecated: null,
              validation: null,
              in: "query",
            },
            {
              name: "offset",
              description: null,
              type: "int",
              required: false,
              nullable: null,
              defaultValue: null,
              deprecated: null,
              validation: null,
              in: "query",
            },
          ],
          referencePath: "#/paths/::users::{id}::posts/get/GetUsersPostsParams",
        },
        models: [],
      });
    });

    it("should warn and skip reference parameters", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const parameters = [
        {
          $ref: "#/components/parameters/IdParam",
        } as ReferenceObject,
        {
          name: "limit",
          in: "query" as const,
          schema: { type: "integer" },
        } as ParameterObject,
      ];

      const result = visitParameters(parameters, {
        documentPath: ["paths", "/ref/{id}", "get"],
        rootSegment: "paths",
        method: "get",
        pathTemplate: "/ref/{id}",
      });

      expect(result).toEqual({
        parameters: [
          {
            name: "limit",
            description: null,
            type: "int",
            required: false,
            nullable: null,
            defaultValue: null,
            deprecated: null,
            in: "query",
          },
        ],
        unifiedModel: {
          kind: "parameter",
          name: "GetRefParams",
          description: "Parameters for GET /ref/{id}",
          properties: [
            {
              name: "limit",
              description: null,
              type: "int",
              required: false,
              nullable: null,
              defaultValue: null,
              deprecated: null,
              validation: null,
              in: "query",
            },
          ],
          referencePath: "#/paths/::ref::{id}/get/GetRefParams",
        },
        models: [],
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "Reference parameter not supported yet: #/components/parameters/IdParam",
      );

      warnSpy.mockRestore();
    });

    it("should handle invalid parameters gracefully", () => {
      const parameters = [
        {
          name: "invalidParam",
          in: "path" as const,
          required: true,
          // schemaなし - visitParameterがnullを返す
        } as ParameterObject,
        {
          name: "validParam",
          in: "query" as const,
          schema: { type: "string" },
        } as ParameterObject,
      ];

      const result = visitParameters(parameters, {
        documentPath: ["paths", "/test", "get"],
        rootSegment: "paths",
        method: "get",
        pathTemplate: "/test",
      });

      expect(result).toEqual({
        parameters: [
          {
            name: "validParam",
            description: null,
            type: "string",
            required: false,
            nullable: null,
            defaultValue: null,
            deprecated: null,
            in: "query",
          },
        ],
        unifiedModel: {
          kind: "parameter",
          name: "GetTestParams",
          description: "Parameters for GET /test",
          properties: [
            {
              name: "validParam",
              description: null,
              type: "string",
              required: false,
              nullable: null,
              defaultValue: null,
              deprecated: null,
              validation: null,
              in: "query",
            },
          ],
          referencePath: "#/paths/::test/get/GetTestParams",
        },
        models: [],
      });
    });

    it("should handle all invalid parameters", () => {
      const parameters = [
        {
          name: "invalid1",
          in: "path" as const,
          required: true,
          // schemaなし
        } as ParameterObject,
        {
          name: "invalid2",
          in: "query" as const,
          // schemaなし
        } as ParameterObject,
      ];

      const result = visitParameters(parameters, {
        documentPath: ["paths", "/test", "get"],
        rootSegment: "paths",
        method: "get",
        pathTemplate: "/test",
      });

      expect(result).toEqual({
        parameters: [],
        unifiedModel: null,
        models: [],
      });
    });

    it("should use correct documentPath for each parameter", () => {
      const parameters = [
        {
          name: "first",
          in: "query" as const,
          schema: { type: "string" },
        } as ParameterObject,
        {
          name: "second",
          in: "query" as const,
          schema: { type: "integer" },
        } as ParameterObject,
      ];

      const result = visitParameters(parameters, {
        documentPath: ["paths", "/api/test", "post"],
        rootSegment: "paths",
        method: "post",
        pathTemplate: "/api/test",
      });

      expect(result).toEqual({
        parameters: [
          {
            name: "first",
            description: null,
            type: "string",
            required: false,
            nullable: null,
            defaultValue: null,
            deprecated: null,
            in: "query",
          },
          {
            name: "second",
            description: null,
            type: "int",
            required: false,
            nullable: null,
            defaultValue: null,
            deprecated: null,
            in: "query",
          },
        ],
        unifiedModel: {
          kind: "parameter",
          name: "PostApiTestParams",
          description: "Parameters for POST /api/test",
          properties: [
            {
              name: "first",
              description: null,
              type: "string",
              required: false,
              nullable: null,
              defaultValue: null,
              deprecated: null,
              validation: null,
              in: "query",
            },
            {
              name: "second",
              description: null,
              type: "int",
              required: false,
              nullable: null,
              defaultValue: null,
              deprecated: null,
              validation: null,
              in: "query",
            },
          ],
          referencePath: "#/paths/::api::test/post/PostApiTestParams",
        },
        models: [],
      });
    });
  });
}
