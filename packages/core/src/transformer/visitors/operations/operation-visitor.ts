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
import type {
  IREndpoint,
  IRHttpMethod,
  IRModel,
  IRSecurityRequirement,
  OperationObject,
  ReferenceObject,
} from "../../../types";
import type {
  OperationContext,
  ParametersContext,
  RequestBodyContext,
  ResponsesContext,
} from "../../types";
import { visitParameters } from "./parameters-visitor";
import { visitRequestBody } from "./request-body-visitor";
import { visitResponses } from "./responses-visitor";

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
    rootSegment: "paths",
    commonParameters: context.commonParameters, // 共通パラメータを渡す
  };

  const parametersResult = visitParameters(
    operation.parameters || null,
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
      rootSegment: "paths",
      contentType: null,
      schemaPath: null,
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
    rootSegment: "paths",
  };

  const responsesResult = visitResponses(
    operation.responses || null,
    responsesContext,
  );

  // 全てのモデルを収集（オブジェクト、列挙型、配列、マップを統一）
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

  // security処理
  let security: IRSecurityRequirement[] | undefined;
  if (operation.security) {
    security = operation.security.map((requirement) => {
      // SecurityRequirementObjectは { schemeName: scopes[] } の形式
      const schemeName = Object.keys(requirement)[0];
      const scopes = requirement[schemeName];
      return {
        scheme: schemeName,
        ...(scopes && scopes.length > 0 && { scopes }),
      };
    });
  }

  const endpoint: IREndpoint = {
    method: context.method as IRHttpMethod,
    path: context.pathTemplate,
    tags: operation.tags || [],
    parameters,
    responses: responsesResult.responses,
    ...(operation.operationId && { operationId: operation.operationId }),
    ...(operation.summary && { summary: operation.summary }),
    ...(operation.description && { description: operation.description }),
    ...(requestBody && { requestBody }),
    ...(operation.deprecated && { deprecated: operation.deprecated }),
    ...(security && { security }),
  };

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
        rootSegment: "paths",
      };

      const result = visitOperation(operation, context);

      expect(result).toEqual({
        endpoint: {
          operationId: "getPet",
          method: "get",
          path: "/pets/{id}",
          summary: "Get a pet by ID",
          description: "Returns a single pet",
          tags: ["pets"],
          parameters: [],
          responses: [
            {
              statusCode: "200",
              description: "Success",
            },
          ],
        },
        models: [],
      });
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
        rootSegment: "paths",
      };

      const result = visitOperation(operation, context);

      expect(result).toEqual({
        endpoint: {
          operationId: "oldEndpoint",
          method: "post",
          path: "/old/endpoint",
          tags: [],
          parameters: [],
          responses: [],
          deprecated: true,
        },
        models: [],
      });
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
        rootSegment: "paths",
      };

      const result = visitOperation(operation, context);

      // operationIdが任意項目なので、処理は継続される
      expect(result).toEqual({
        endpoint: {
          method: "get",
          path: "/missing",
          summary: "Missing ID",
          tags: [],
          parameters: [],
          responses: [],
        },
        models: [],
      });
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
        rootSegment: "paths",
      };

      const result = visitOperation(operation, context);

      expect(result).toEqual({
        endpoint: {
          operationId: "noTags",
          method: "get",
          path: "/no-tags",
          tags: [],
          parameters: [],
          responses: [],
        },
        models: [],
      });
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
        rootSegment: "paths",
      };

      const result = visitOperation(operation, context);

      expect(result).toEqual({
        endpoint: {
          operationId: "withParams",
          method: "get",
          path: "/with/{id}",
          tags: [],
          parameters: {
            kind: "ref",
            name: "#/paths/::with::{id}/get/parameters/GetWithIdParams",
          },
          responses: [],
        },
        models: [
          {
            kind: "parameter",
            name: "GetWithIdParams",
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
                defaultValue: 10,
                in: "query",
              },
            ],
            referencePath:
              "#/paths/::with::{id}/get/parameters/GetWithIdParams",
          },
        ],
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
        rootSegment: "paths",
      };

      const result = visitOperation(operation, context);

      expect(result).toEqual({
        endpoint: {
          operationId: "createPet",
          method: "post",
          path: "/pets",
          tags: [],
          parameters: [],
          requestBody: {
            kind: "content",
            description: "Pet to add",
            required: true,
            content: [
              {
                mimeType: "application/json",
                schema: {
                  kind: "ref",
                  name: "#/paths/::pets/post/requestBody/content/application::json/schema/PostPetsRequestBody",
                },
              },
            ],
          },
          responses: [],
        },
        models: [
          {
            kind: "requestBody",
            name: "PostPetsRequestBody",
            referencePath:
              "#/paths/::pets/post/requestBody/content/application::json/schema/PostPetsRequestBody",
            properties: [
              {
                name: "name",
                type: "string",
              },
              {
                name: "age",
                type: "int",
              },
            ],
            required: true,
          },
        ],
      });
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
        rootSegment: "paths",
      };

      const result = visitOperation(operation, context);

      expect(result).toEqual({
        endpoint: {
          operationId: "getPet",
          method: "get",
          path: "/pets/{id}",
          tags: [],
          parameters: [],
          responses: [
            {
              statusCode: "200",
              description: "Success",
              content: [
                {
                  mimeType: "application/json",
                  schema: {
                    kind: "ref",
                    name: "#/paths/::pets::{id}/get/responses/200/content/application::json/schema/GetPetsId200Response",
                  },
                },
              ],
            },
            {
              statusCode: "404",
              description: "Not found",
            },
          ],
        },
        models: [
          {
            kind: "response",
            name: "GetPetsId200Response",
            referencePath:
              "#/paths/::pets::{id}/get/responses/200/content/application::json/schema/GetPetsId200Response",
            statusCode: "200",
            properties: [
              {
                name: "id",
                type: "string",
              },
              {
                name: "name",
                type: "string",
              },
            ],
          },
        ],
      });
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
        rootSegment: "paths",
      };

      const result = visitOperation(operation, context);

      expect(result).toEqual({
        endpoint: {
          operationId: "withRefParam",
          method: "get",
          path: "/ref/{id}",
          tags: [],
          parameters: {
            kind: "ref",
            name: "#/paths/::ref::{id}/get/parameters/GetRefIdParams",
          },
          responses: [],
        },
        models: [
          {
            kind: "parameter",
            name: "GetRefIdParams",
            description: "Parameters for GET /ref/{id}",
            properties: [
              {
                name: "limit",
                type: "int",
                in: "query",
              },
            ],
            referencePath: "#/paths/::ref::{id}/get/parameters/GetRefIdParams",
          },
        ],
      });

      expect(warnSpy).toHaveBeenCalledWith(
        "Reference parameter not supported yet: #/components/parameters/IdParam",
      );

      warnSpy.mockRestore();
    });
  });
}
