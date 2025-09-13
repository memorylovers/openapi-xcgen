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
import type { ParameterObject, ReferenceObject } from "../../types/index";
import type {
  IRModel,
  IRParameter,
  IRParameterModel,
} from "../../types/ir/index";
import { createParameterModel } from "../helpers/create-parameter-model";
import type { VisitorContext } from "../types";
import { visitParameter } from "./parameter-visitor";

/**
 * Parameters処理用の拡張コンテキスト
 */
export interface ParametersContext extends VisitorContext {
  /** HTTPメソッド */
  method: string;
  /** パステンプレート */
  pathTemplate: string;
}

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
  parameters: (ParameterObject | ReferenceObject)[] | undefined,
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

    const irParam = visitParameter(param, {
      documentPath: [...context.documentPath, "parameters", param.name],
    });

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
    it("should return empty result for undefined parameters", () => {
      const result = visitParameters(undefined, {
        documentPath: ["paths", "/test", "get"],
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
        method: "get",
        pathTemplate: "/users/{id}",
      });

      expect(result).toEqual({
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "User ID",
            type: "string",
          },
        ],
        unifiedModel: {
          kind: "parameter",
          name: "GetUsersParams",
          description: "Parameters for GET /users/{id}\nid: User ID",
          properties: [
            {
              name: "id",
              type: "string",
              required: true,
              description: "User ID",
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
          schema: { type: "integer", default: 0 },
        } as ParameterObject,
      ];

      const result = visitParameters(parameters, {
        documentPath: ["paths", "/users/{id}/posts", "get"],
        method: "get",
        pathTemplate: "/users/{id}/posts",
      });

      expect(result).toEqual({
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            type: "string",
          },
          {
            name: "limit",
            in: "query",
            required: false,
            type: "int",
            defaultValue: 10,
          },
          {
            name: "offset",
            in: "query",
            required: false,
            type: "int",
            defaultValue: 0,
          },
        ],
        unifiedModel: {
          kind: "parameter",
          name: "GetUsersPostsParams",
          description: "Parameters for GET /users/{id}/posts",
          properties: [
            {
              name: "id",
              type: "string",
              required: true,
              in: "path",
            },
            {
              name: "limit",
              type: "int",
              required: false,
              defaultValue: 10,
              in: "query",
            },
            {
              name: "offset",
              type: "int",
              required: false,
              defaultValue: 0,
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
        method: "get",
        pathTemplate: "/ref/{id}",
      });

      expect(result).toEqual({
        parameters: [
          {
            name: "limit",
            in: "query",
            required: false,
            type: "int",
          },
        ],
        unifiedModel: {
          kind: "parameter",
          name: "GetRefParams",
          description: "Parameters for GET /ref/{id}",
          properties: [
            {
              name: "limit",
              type: "int",
              required: false,
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
        method: "get",
        pathTemplate: "/test",
      });

      expect(result).toEqual({
        parameters: [
          {
            name: "validParam",
            in: "query",
            required: false,
            type: "string",
          },
        ],
        unifiedModel: {
          kind: "parameter",
          name: "GetTestParams",
          description: "Parameters for GET /test",
          properties: [
            {
              name: "validParam",
              type: "string",
              required: false,
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
        method: "post",
        pathTemplate: "/api/test",
      });

      expect(result).toEqual({
        parameters: [
          {
            name: "first",
            in: "query",
            required: false,
            type: "string",
          },
          {
            name: "second",
            in: "query",
            required: false,
            type: "int",
          },
        ],
        unifiedModel: {
          kind: "parameter",
          name: "PostApiTestParams",
          description: "Parameters for POST /api/test",
          properties: [
            {
              name: "first",
              type: "string",
              required: false,
              in: "query",
            },
            {
              name: "second",
              type: "int",
              required: false,
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
