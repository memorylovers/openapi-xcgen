/**
 * operation-visitor.ts - OperationObjectを処理してIREndpointに変換
 *
 * OpenAPIのOperationObject（個別のAPI操作）を処理し、
 * IREndpointに変換する。
 *
 * 責務:
 * - operationId、summary、description、tags、deprecatedの処理
 * - parameters配列の処理（visitParametersに委譲）
 * - requestBodyの処理（visitRequestBodyに委譲）
 * - responsesの処理（visitResponsesに委譲）
 */

import { consola } from "consola";
import type { OperationObject, ReferenceObject } from "../../types/index";
import type { IREndpoint, IRHttpMethod, IRModel } from "../../types/ir/index";
import type { VisitorContext } from "../types";
import { visitParameters, type ParametersContext } from "./parameters-visitor";
import {
  visitRequestBody,
  type RequestBodyContext,
} from "./request-body-visitor";
import { visitResponses, type ResponsesContext } from "./responses-visitor";

/**
 * Operation処理用の拡張コンテキスト
 */
export interface OperationContext extends VisitorContext {
  /** HTTPメソッド（get/post/put等） */
  method: string;
  /** パステンプレート（例: "/pets/{id}"） */
  pathTemplate: string;
}

/**
 * Operation処理の結果
 */
export interface OperationResult {
  /** 生成されたエンドポイント */
  endpoint: IREndpoint;
  /** インラインスキーマから抽出されたモデル（オブジェクト、列挙型、配列、マップを統一） */
  models: IRModel[];
}

/**
 * OperationObjectを処理してIREndpointとインラインモデルに変換
 *
 * @param operation - OpenAPIのOperationObject
 * @param context - Operation用のコンテキスト
 * @returns OperationResult、またはnull（operationIdがない場合）
 *
 * @example OpenAPI YAML
 * ```yaml
 * get:
 *   operationId: getPet
 *   summary: Get a pet by ID
 *   description: Returns a single pet
 *   tags: [pets]
 *   deprecated: false
 *   parameters:
 *     - name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *   responses:
 *     '200':
 *       description: Success
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pet'
 * ```
 */
export function visitOperation(
  operation: OperationObject,
  context: OperationContext,
): OperationResult | null {
  // parameters処理
  const parametersContext: ParametersContext = {
    documentPath: [...context.documentPath, "parameters"],
    method: context.method,
    pathTemplate: context.pathTemplate,
  };

  const parametersResult = visitParameters(
    operation.parameters,
    parametersContext,
  );

  // requestBody処理
  let requestBody;
  const models: IRModel[] = [];

  if (operation.requestBody) {
    const requestBodyContext: RequestBodyContext = {
      documentPath: [...context.documentPath, "requestBody"],
      method: context.method,
      pathTemplate: context.pathTemplate,
    };

    const requestBodyResult = visitRequestBody(
      operation.requestBody,
      operation.operationId || null,
      requestBodyContext,
    );

    if (requestBodyResult) {
      if (requestBodyResult.requestBody) {
        requestBody = requestBodyResult.requestBody;
      }

      // インラインモデルを収集（オブジェクト、列挙型、配列、マップを統一）
      models.push(...requestBodyResult.models);
    }
  }

  // responses処理
  const responsesContext: ResponsesContext = {
    documentPath: [...context.documentPath, "responses"],
    method: context.method,
    pathTemplate: context.pathTemplate,
  };

  const responsesResult = visitResponses(operation.responses, responsesContext);

  // 全てのモデルを収集（オブジェクト、列挙型、配列、マップを統一）
  models.push(...parametersResult.models);

  models.push(...responsesResult.models);

  // パラメータ統合モデルを追加
  if (parametersResult.unifiedModel) {
    models.push(parametersResult.unifiedModel);
  }

  // parameters設定: 統合モデルがある場合は参照、ない場合は個別配列
  const parameters = parametersResult.unifiedModel
    ? {
        kind: "ref" as const,
        name: parametersResult.unifiedModel.referencePath,
      }
    : parametersResult.parameters;

  const endpoint: IREndpoint = {
    id: operation.operationId || null,
    method: context.method as IRHttpMethod,
    path: context.pathTemplate,
    summary: operation.summary,
    parameters,
    responses: responsesResult.responses,
  };

  // Optional properties: only include if they have actual values
  if (operation.description !== undefined) {
    endpoint.description = operation.description;
  }
  if (requestBody !== undefined) {
    endpoint.requestBody = requestBody;
  }
  if (operation.deprecated !== undefined) {
    endpoint.deprecated = operation.deprecated;
  }

  return {
    endpoint,
    models,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitOperation", () => {
    it("should extract basic operation info", () => {
      const operation: OperationObject = {
        operationId: "getPet",
        summary: "Get a pet by ID",
        description: "Returns a single pet",
        tags: ["pets"],
        responses: {
          "200": { description: "Success" },
        },
      };

      const context: OperationContext = {
        documentPath: ["paths", "/pets/{id}", "get"],
        method: "get",
        pathTemplate: "/pets/{id}",
      };

      const result = visitOperation(operation, context);

      expect(result).not.toBeNull();
      expect(result?.endpoint).toEqual(
        expect.objectContaining({
          id: "getPet",
          method: "get",
          path: "/pets/{id}",
          summary: "Get a pet by ID",
          description: "Returns a single pet",
          parameters: [],
          responses: expect.any(Array),
        }),
      );
      expect(result?.models).toEqual([]);
    });

    it("should handle deprecated operations", () => {
      const operation: OperationObject = {
        operationId: "oldEndpoint",
        deprecated: true,
        responses: {},
      };

      const context: OperationContext = {
        documentPath: ["paths", "/old/endpoint", "post"],
        method: "post",
        pathTemplate: "/old/endpoint",
      };

      const result = visitOperation(operation, context);

      expect(result).not.toBeNull();
      expect(result?.endpoint.deprecated).toBe(true);
    });

    it("should handle operations without operationId as optional field", () => {
      const operation: OperationObject = {
        // operationIdなし - OpenAPI仕様では任意項目
        summary: "Missing ID",
        responses: {},
      };

      const context: OperationContext = {
        documentPath: ["paths", "/missing", "get"],
        method: "get",
        pathTemplate: "/missing",
      };

      const result = visitOperation(operation, context);

      // operationIdが任意項目なので、処理は継続される
      expect(result).not.toBeNull();
      expect(result?.endpoint.id).toBeNull();
      expect(result?.endpoint.summary).toBe("Missing ID");
      expect(result?.endpoint.method).toBe("get");
      expect(result?.endpoint.path).toBe("/missing");
    });

    it("should handle operations without tags", () => {
      const operation: OperationObject = {
        operationId: "noTags",
        // tagsなし
        responses: {},
      };

      const context: OperationContext = {
        documentPath: ["paths", "/no-tags", "get"],
        method: "get",
        pathTemplate: "/no-tags",
      };

      const result = visitOperation(operation, context);

      expect(result).not.toBeNull();
      expect(result?.endpoint.id).toBe("noTags");
    });

    it("should process parameters array and create unified model reference", () => {
      const operation: OperationObject = {
        operationId: "withParams",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {},
      };

      const context: OperationContext = {
        documentPath: ["paths", "/with/{id}", "get"],
        method: "get",
        pathTemplate: "/with/{id}",
      };

      const result = visitOperation(operation, context);

      expect(result).not.toBeNull();

      // parameters は統合モデルへの参照になる
      expect(result?.endpoint.parameters).toEqual({
        kind: "ref",
        name: "#/paths/::with::{id}/get/parameters/GetWithParams",
      });

      // 統合モデルが models 配列に含まれる
      expect(result?.models).toHaveLength(1);
      const unifiedModel = result?.models[0];
      expect(unifiedModel).toEqual({
        kind: "parameter",
        name: "GetWithParams",
        description: "Parameters for GET /with/{id}",
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
        ],
        referencePath: expect.stringContaining("GetWithParams"),
      });
    });

    it("should process requestBody", () => {
      const operation: OperationObject = {
        operationId: "createPet",
        requestBody: {
          description: "Pet to add",
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  age: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {},
      };

      const context: OperationContext = {
        documentPath: ["paths", "/pets", "post"],
        method: "post",
        pathTemplate: "/pets",
      };

      const result = visitOperation(operation, context);

      expect(result).not.toBeNull();
      expect(result?.endpoint.requestBody).toBeDefined();
      expect(result?.endpoint.requestBody?.description).toBe("Pet to add");
      expect(result?.endpoint.requestBody?.required).toBe(true);
      expect(result?.endpoint.requestBody?.content).toBeDefined();
      expect(
        result?.endpoint.requestBody?.content?.find(
          (c) => c.mimeType === "application/json",
        ),
      ).toBeDefined();
      // インラインオブジェクトスキーマは独立したObjectModelとして抽出される
      expect(result?.models).toHaveLength(1);

      // 独立したRequestBodyModelが生成される
      const requestBodyModel = result?.models.find(
        (m) => m.kind === "requestBody",
      );
      expect(requestBodyModel?.name).toBe("PostPetsRequestBody");
    });

    it("should process responses with content", () => {
      const operation: OperationObject = {
        operationId: "getPet",
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Not found",
          },
        },
      };

      const context: OperationContext = {
        documentPath: ["paths", "/pets/{id}", "get"],
        method: "get",
        pathTemplate: "/pets/{id}",
      };

      const result = visitOperation(operation, context);

      expect(result).not.toBeNull();
      expect(result?.endpoint.responses).toHaveLength(2);

      const response200 = result?.endpoint.responses.find(
        (r) => r.statusCode === "200",
      );
      expect(response200).toBeDefined();
      expect(response200?.description).toBe("Success");
      expect(
        response200?.content?.find((c) => c.mimeType === "application/json"),
      ).toBeDefined();

      const response404 = result?.endpoint.responses.find(
        (r) => r.statusCode === "404",
      );
      expect(response404).toBeDefined();
      expect(response404?.description).toBe("Not found");
      expect(response404?.content).toBeUndefined();
    });

    it("should warn and skip reference parameters", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const operation: OperationObject = {
        operationId: "withRefParam",
        parameters: [
          {
            $ref: "#/components/parameters/IdParam",
          } as ReferenceObject,
          {
            name: "limit",
            in: "query",
            schema: { type: "integer" },
          },
        ],
        responses: {},
      };

      const context: OperationContext = {
        documentPath: ["paths", "/ref/{id}", "get"],
        method: "get",
        pathTemplate: "/ref/{id}",
      };

      const result = visitOperation(operation, context);

      expect(result).not.toBeNull();

      // 有効なパラメータが1つあるので統合モデル参照になる
      expect(result?.endpoint.parameters).toEqual({
        kind: "ref",
        name: "#/paths/::ref::{id}/get/parameters/GetRefParams",
      });

      // 統合モデルは有効なパラメータのみで構成される
      expect(result?.models).toHaveLength(1);
      const unifiedModel = result?.models[0];
      expect(unifiedModel).toEqual({
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
        referencePath: expect.stringContaining("GetRefParams"),
      });

      expect(warnSpy).toHaveBeenCalledWith(
        "Reference parameter not supported yet: #/components/parameters/IdParam",
      );

      warnSpy.mockRestore();
    });
  });
}
