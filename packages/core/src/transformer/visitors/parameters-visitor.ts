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

      expect(result.parameters).toEqual([]);
      expect(result.unifiedModel).toBeNull();
      expect(result.models).toEqual([]);
    });

    it("should return empty result for empty parameters array", () => {
      const result = visitParameters([], {
        documentPath: ["paths", "/test", "get"],
        method: "get",
        pathTemplate: "/test",
      });

      expect(result.parameters).toEqual([]);
      expect(result.unifiedModel).toBeNull();
      expect(result.models).toEqual([]);
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

      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0]).toEqual({
        name: "id",
        in: "path",
        required: true,
        description: "User ID",
        type: "string",
        defaultValue: undefined,
        deprecated: undefined,
      });

      // 統合モデルが生成される
      expect(result.unifiedModel).not.toBeNull();
      expect(result.unifiedModel!.kind).toBe("parameter");
      expect(result.unifiedModel!.name).toBe("GetUsersParams");
      expect(result.unifiedModel!.properties).toHaveLength(1);
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

      expect(result.parameters).toHaveLength(3);
      expect(result.parameters[0].name).toBe("id");
      expect(result.parameters[0].in).toBe("path");
      expect(result.parameters[1].name).toBe("limit");
      expect(result.parameters[1].in).toBe("query");
      expect(result.parameters[2].name).toBe("offset");
      expect(result.parameters[2].in).toBe("query");

      // 統合モデルが生成される
      expect(result.unifiedModel).not.toBeNull();
      expect(result.unifiedModel!.kind).toBe("parameter");
      expect(result.unifiedModel!.name).toBe("GetUsersPostsParams");
      expect(result.unifiedModel!.properties).toHaveLength(3);
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

      expect(result.parameters).toHaveLength(1); // 参照は飛ばされる
      expect(result.parameters[0].name).toBe("limit");
      expect(warnSpy).toHaveBeenCalledWith(
        "Reference parameter not supported yet: #/components/parameters/IdParam",
      );

      // 統合モデルは有効なパラメータのみで生成される
      expect(result.unifiedModel).not.toBeNull();
      expect(result.unifiedModel!.kind).toBe("parameter");
      expect(result.unifiedModel!.name).toBe("GetRefParams");
      expect(result.unifiedModel!.properties).toHaveLength(1);

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

      // 有効なパラメータのみ含まれる
      expect(result.parameters).toHaveLength(1);
      expect(result.parameters[0].name).toBe("validParam");

      // 統合モデルは有効なパラメータのみで生成される
      expect(result.unifiedModel).not.toBeNull();
      expect(result.unifiedModel!.properties).toHaveLength(1);
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

      expect(result.parameters).toEqual([]);
      expect(result.unifiedModel).toBeNull(); // 有効なパラメータがないので統合モデルもnull
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

      expect(result.parameters).toHaveLength(2);
      expect(result.unifiedModel).not.toBeNull();
      expect(result.unifiedModel!.kind).toBe("parameter");
      expect(result.unifiedModel!.name).toBe("PostApiTestParams");

      // documentPathが適切に継承されていることを確認
      expect(result.unifiedModel!.referencePath).toContain("paths");
      expect(result.unifiedModel!.referencePath).toContain("api");
      expect(result.unifiedModel!.referencePath).toContain("test");
    });
  });
}
