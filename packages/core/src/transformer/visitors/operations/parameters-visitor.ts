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
import type {
  IRModel,
  IRParameter,
  IRParameterModel,
  ParameterObject,
  ReferenceObject,
} from "../../../types";
import { isReferenceObject } from "../../../types";
import { createParameterModel, parseParameterPath } from "../../helpers";
import type { ParameterContext, ParametersContext } from "../../types";
import { visitParameter } from "./parameter-visitor";

/**
 * Parameters処理の結果
 */
export interface ParametersResult {
  /** 個別のパラメータ配列 */
  parameters: IRParameter[];
  /** パラメータ統合モデル（パラメータがない場合はnull） */
  unifiedModel: IRParameterModel | null;
  /** パラメータの配列型から抽出されたモデル */
  models: IRModel[];
}

/**
 * 共通パラメータとOperationパラメータをマージ
 * 同じname + inの組み合わせの場合、Operationレベルが優先される
 *
 * @param commonParams - PathItemレベルの共通パラメータ
 * @param operationParams - Operationレベルのパラメータ
 * @returns マージ後のパラメータ配列
 */
function mergeParameters(
  commonParams: (ParameterObject | ReferenceObject)[],
  operationParams: (ParameterObject | ReferenceObject)[],
): (ParameterObject | ReferenceObject)[] {
  // Operationパラメータのname + inの組み合わせを記録
  const operationParamKeys = new Set<string>();

  for (const param of operationParams) {
    if (!isReferenceObject(param)) {
      const key = `${param.name}:${param.in}`;
      operationParamKeys.add(key);
    }
  }

  // 共通パラメータをフィルタ（Operationで上書きされているものを除外）
  const filteredCommonParams = commonParams.filter((param) => {
    if (!isReferenceObject(param)) {
      const key = `${param.name}:${param.in}`;
      return !operationParamKeys.has(key);
    }
    return true; // $ref参照は後で警告を出すので、ここでは含める
  });

  // 共通パラメータを先に、Operationパラメータを後に配置
  return [...filteredCommonParams, ...operationParams];
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

  // 共通パラメータとOperationパラメータをマージ
  const mergedParameters = mergeParameters(
    context.commonParameters || [],
    parameters || [],
  );

  // パラメータ配列が存在しない場合
  if (mergedParameters.length === 0) {
    return {
      parameters: [],
      unifiedModel: null,
      models: [],
    };
  }

  // 各パラメータを処理
  for (let i = 0; i < mergedParameters.length; i++) {
    const param = mergedParameters[i];

    if (isReferenceObject(param)) {
      consola.warn(`Reference parameter not supported yet: ${param.$ref}`);
      continue;
    }

    const paramContext: ParameterContext = {
      kind: "parameter",
      documentPath: [...context.documentPath, param.name],
      parameterName: param.name,
      in: param.in as "path" | "query" | "header" | "cookie",
      rootSegment: "paths",
    };
    const paramResult = visitParameter(param, paramContext);

    if (paramResult) {
      irParameters.push(paramResult.parameter);
      models.push(...paramResult.models);
    }
  }

  // パラメータ統合モデル生成
  const parsed = parseParameterPath(context.documentPath);
  if (!parsed) {
    consola.warn(
      `Failed to parse parameter path: ${context.documentPath.join("/")}`,
    );
    return { parameters: irParameters, unifiedModel: null, models };
  }

  const unifiedModel = createParameterModel(
    irParameters,
    parsed.pathTemplate,
    parsed.method,
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

  describe("mergeParameters", () => {
    it("should merge common and operation parameters", () => {
      const common = [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
        {
          name: "version",
          in: "header",
          schema: { type: "string" },
        },
      ] as ParameterObject[];

      const operation = [
        { name: "limit", in: "query", schema: { type: "integer" } },
      ] as ParameterObject[];

      const result = mergeParameters(common, operation);

      expect(result).toHaveLength(3);
      expect((result[0] as ParameterObject).name).toBe("id");
      expect((result[1] as ParameterObject).name).toBe("version");
      expect((result[2] as ParameterObject).name).toBe("limit");
    });

    it("should override common parameter with operation parameter", () => {
      const common = [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Common ID",
        },
      ] as ParameterObject[];

      const operation = [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Operation ID",
        },
      ] as ParameterObject[];

      const result = mergeParameters(common, operation);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(operation[0]);
      expect((result[0] as ParameterObject).description).toBe("Operation ID");
    });

    it("should handle $ref parameters", () => {
      const common = [{ $ref: "#/components/parameters/CommonParam" }];
      const operation = [{ name: "id", in: "path", required: true }] as (
        | ParameterObject
        | ReferenceObject
      )[];

      const result = mergeParameters(common, operation);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(common[0]);
      expect(result[1]).toEqual(operation[0]);
    });
  });

  describe("visitParameters", () => {
    it("should return empty result for null parameters", () => {
      const result = visitParameters(null, {
        kind: "parameters",
        documentPath: ["paths", "/test", "get"],
        rootSegment: "paths",
      });

      expect(result).toEqual({
        parameters: [],
        unifiedModel: null,
        models: [],
      });
    });

    it("should return empty result for empty parameters array", () => {
      const result = visitParameters([], {
        kind: "parameters",
        documentPath: ["paths", "/test", "get"],
        rootSegment: "paths",
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
        kind: "parameters",
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths",
      });

      expect(result.parameters).toEqual([
        {
          name: "id",
          description: "User ID",
          type: "string",
          required: true,
          in: "path",
        },
      ]);
      expect(result.unifiedModel).toEqual({
        kind: "parameter",
        name: "GetUsersIdParams",
        description: "Parameters for GET /users/{id}\nid: User ID",
        properties: [
          {
            name: "id",
            description: "User ID",
            type: "string",
            required: true,
            in: "path",
          },
        ],
        referencePath: "#/paths/::users::{id}/get/GetUsersIdParams",
      });
      expect(result.models).toEqual([]);
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
        kind: "parameters",
        documentPath: ["paths", "/users/{id}/posts", "get"],
        rootSegment: "paths",
      });

      expect(result.parameters).toHaveLength(3);
      expect(result.parameters[0].name).toBe("id");
      expect(result.parameters[1].name).toBe("limit");
      expect(result.parameters[2].name).toBe("offset");
      expect(result.unifiedModel?.name).toBe("GetUsersIdPostsParams");
      expect(result.models).toEqual([]);
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
        kind: "parameters",
        documentPath: ["paths", "/ref/{id}", "get"],
        rootSegment: "paths",
      });

      expect(result.parameters).toEqual([
        {
          name: "limit",
          type: "int",
          in: "query",
        },
      ]);
      expect(result.unifiedModel?.name).toBe("GetRefIdParams");
      expect(result.models).toEqual([]);
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
        kind: "parameters",
        documentPath: ["paths", "/test", "get"],
        rootSegment: "paths",
      });

      expect(result.parameters).toEqual([
        {
          name: "validParam",
          type: "string",
          in: "query",
        },
      ]);
      expect(result.unifiedModel?.name).toBe("GetTestParams");
      expect(result.models).toEqual([]);
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
        kind: "parameters",
        documentPath: ["paths", "/test", "get"],
        rootSegment: "paths",
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
        kind: "parameters",
        documentPath: ["paths", "/api/test", "post"],
        rootSegment: "paths",
      });

      expect(result.parameters).toHaveLength(2);
      expect(result.parameters[0].name).toBe("first");
      expect(result.parameters[1].name).toBe("second");
      expect(result.unifiedModel?.name).toBe("PostApiTestParams");
      expect(result.models).toEqual([]);
    });

    it("should inherit common parameters from PathItem", () => {
      const operationParams = [
        {
          name: "limit",
          in: "query" as const,
          schema: { type: "integer" },
        } as ParameterObject,
      ];

      const result = visitParameters(operationParams, {
        kind: "parameters",
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths",
        commonParameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
      });

      expect(result.parameters).toHaveLength(2);
      expect(result.parameters[0].name).toBe("id");
      expect(result.parameters[0].in).toBe("path");
      expect(result.parameters[1].name).toBe("limit");
      expect(result.parameters[1].in).toBe("query");
    });

    it("should allow operation to override common parameter", () => {
      const operationParams = [
        {
          name: "id",
          in: "path" as const,
          required: true,
          schema: { type: "string" },
          description: "Operation parameter",
        } as ParameterObject,
      ];

      const result = visitParameters(operationParams, {
        kind: "parameters",
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths",
        commonParameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Common parameter",
          },
        ],
      });

      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0].description).toBe("Operation parameter");
    });
  });
}
