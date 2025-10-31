/**
 * Operation Transformer - v2 Transformer Architecture
 *
 * OperationObjectをIREndpointに変換します。
 * parameters, requestBody, responsesの処理はそれぞれのtraverserに委譲します。
 */

import { consola } from "consola";
import type {
  IREndpoint,
  IRExtensions,
  IRHttpMethod,
  IRModel,
  IRParameter,
  IRRef,
  IRRequestBody,
  IRRequestContent,
  IRResponse,
  IRResponseContent,
  IRResponseHeader,
  IRSecurityRequirement,
  IRType,
  MimeType,
  OperationObject,
  ParameterObject,
  PathItemObject,
} from "../../../types";
import { extractExtensions } from "../../helpers/extract-extensions";
import type { VisitorContext } from "../../types";
import { aggregateParameters } from "../aggregators/parameter-aggregator";
import type {
  OperationTraversalResult,
  ParametersTraversalResult,
} from "../types";

/**
 * Operation変換の結果
 */
export interface OperationTransformResult {
  /** 生成されたエンドポイント（失敗時はnull） */
  endpoint: IREndpoint | null;
  /** 抽出されたモデルの配列 */
  models: IRModel[];
}

/**
 * ParametersTraversalResultのパラメータをIRParameterに変換
 *
 * @param param - ParametersTraversalResultのパラメータ
 * @returns IRParameter
 */
function convertToIRParameter(
  param: ParametersTraversalResult["parameters"][number],
): IRParameter {
  return {
    name: param.name,
    in: param.in,
    type: param.type,
    ...(param.required && { required: true }),
    ...(param.nullable && { nullable: true }),
    ...(param.description && { description: param.description }),
    ...(param.defaultValue !== undefined && {
      defaultValue: param.defaultValue,
    }),
    ...(param.deprecated && { deprecated: true }),
  };
}

/**
 * OpenAPI SecurityRequirementをIRSecurityRequirementに変換
 *
 * OpenAPI形式: { "ApiKey": [], "OAuth2": ["read:pets", "write:pets"] }
 * IR形式: [{ scheme: "ApiKey", scopes: [] }, { scheme: "OAuth2", scopes: ["read:pets", "write:pets"] }]
 *
 * @param security - OpenAPIのsecurity配列
 * @returns IRSecurityRequirement配列、存在しない場合はundefined
 */
function convertSecurityRequirements(
  security: Array<Record<string, string[]>> | undefined,
): IRSecurityRequirement[] | undefined {
  if (!security || security.length === 0) {
    return undefined;
  }

  const irSecurity: IRSecurityRequirement[] = [];

  for (const requirement of security) {
    for (const [scheme, scopes] of Object.entries(requirement)) {
      irSecurity.push({
        scheme,
        ...(scopes && scopes.length > 0 && { scopes }),
      });
    }
  }

  return irSecurity.length > 0 ? irSecurity : undefined;
}

/**
 * PathItemとOperationのextensionsをマージ（Operation優先）
 *
 * 同じキーがある場合、Operation側の値が優先される（完全上書き、deepマージではない）
 *
 * @param pathItemExtensions - PathItemレベルの拡張フィールド
 * @param operationExtensions - Operationレベルの拡張フィールド
 * @returns マージされた拡張フィールド、存在しない場合はundefined
 */
function mergeExtensions(
  pathItemExtensions: IRExtensions | undefined,
  operationExtensions: IRExtensions | undefined,
): IRExtensions | undefined {
  if (!pathItemExtensions && !operationExtensions) {
    return undefined;
  }

  // Operation優先でマージ（スプレッド演算子でshallow merge）
  const merged = {
    ...pathItemExtensions,
    ...operationExtensions,
  };

  return Object.keys(merged).length > 0 ? merged : undefined;
}

/**
 * OperationObjectをIREndpointに変換
 *
 * @param operation - OperationObject
 * @param pathTemplate - パステンプレート（例: "/users/{id}"）
 * @param method - HTTPメソッド
 * @param context - Visitorコンテキスト
 * @param pathItemParameters - PathItemレベルのパラメータ（オプション）
 * @param traversalResult - operation-traverserからの結果
 * @param pathItem - PathItemObject（security/extensions取得用、オプション）
 * @returns OperationTransformResult
 *
 * @example OpenAPI YAML
 * ```yaml
 * paths:
 *   /users/{id}:
 *     get:
 *       summary: Get user by ID
 *       operationId: getUserById
 *       parameters:
 *         - name: id
 *           in: path
 *           required: true
 *           schema:
 *             type: string
 *       responses:
 *         '200':
 *           description: Success
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/User'
 * ```
 */
export function transformOperation(
  operation: OperationObject,
  pathTemplate: string,
  method: IRHttpMethod,
  context: VisitorContext,
  _pathItemParameters?: ParameterObject[],
  traversalResult?: OperationTraversalResult,
  pathItem?: PathItemObject,
): OperationTransformResult {
  consola.debug(
    `Transforming operation: ${method.toUpperCase()} ${pathTemplate}`,
  );

  const allModels: IRModel[] = [];

  // ========================================
  // 1. Parametersの処理
  // ========================================
  let endpointParameters: IRType | IRParameter[];

  if (traversalResult?.parametersResult) {
    // IRParameterに変換
    const irParameters: IRParameter[] =
      traversalResult.parametersResult.parameters.map(convertToIRParameter);

    // parameter-aggregatorで統合モデルを生成
    const aggregationResult = aggregateParameters(
      irParameters,
      context,
      pathTemplate,
      method,
    );

    if (aggregationResult.model) {
      // 統合モデルが生成された場合
      allModels.push(aggregationResult.model);
      endpointParameters = aggregationResult.reference!;
    } else {
      // パラメータがない場合
      endpointParameters = [];
    }

    // NOTE: parametersResult.childModelsはtraversalResult.childModelsに既に含まれているため、
    // ここでは追加しない（重複を防ぐため）
  } else {
    endpointParameters = [];
  }

  // ========================================
  // 2. RequestBodyの処理
  // ========================================
  let endpointRequestBody: IRRequestBody | undefined;

  if (traversalResult?.requestBodyResult) {
    const { required, description, content } =
      traversalResult.requestBodyResult;

    // IRRequestContentに変換
    const irRequestContent: IRRequestContent[] = content.content.map((c) => ({
      mimeType: c.mimeType as MimeType,
      schema: c.schema,
    }));

    endpointRequestBody = {
      kind: "content",
      ...(required && { required: true }),
      ...(description && { description }),
      content: irRequestContent,
    };

    // NOTE: content.childModelsはtraversalResult.childModelsに既に含まれているため、
    // ここでは追加しない（重複を防ぐため）
  }

  // ========================================
  // 3. Responsesの処理
  // ========================================
  const endpointResponses: IRResponse[] = [];

  if (traversalResult?.responsesResult) {
    for (const response of traversalResult.responsesResult.responses) {
      if (response.ref) {
        // 参照レスポンス
        const ref: IRRef = {
          kind: "ref",
          name: response.ref,
        };
        endpointResponses.push({
          kind: "ref",
          statusCode: response.statusCode,
          ref,
        });
      } else {
        // コンテンツレスポンス
        const irResponseContent: IRResponseContent[] | undefined =
          response.content?.map((c) => ({
            mimeType: c.mimeType as MimeType,
            schema: c.schema,
          }));

        const irResponseHeaders: IRResponseHeader[] | undefined =
          response.headers?.map((h) => ({
            name: h.name,
            type: h.type,
            ...(h.description && { description: h.description }),
            ...(h.defaultValue !== undefined && {
              defaultValue: h.defaultValue,
            }),
            ...(h.deprecated && { deprecated: true }),
          }));

        endpointResponses.push({
          kind: "content",
          statusCode: response.statusCode,
          ...(response.description && { description: response.description }),
          ...(irResponseContent && { content: irResponseContent }),
          ...(irResponseHeaders && { headers: irResponseHeaders }),
        });
      }
    }

    // NOTE: responsesResult.childModelsはtraversalResult.childModelsに既に含まれているため、
    // ここでは追加しない（重複を防ぐため）
  }

  // ========================================
  // 4. 全体の子モデルを追加
  // ========================================
  if (traversalResult?.childModels) {
    allModels.push(...traversalResult.childModels);
  }

  // ========================================
  // 5. Securityの処理
  // ========================================
  const endpointSecurity = convertSecurityRequirements(operation.security);

  // ========================================
  // 6. Extensionsの処理（PathItem + Operation merge）
  // ========================================
  const pathItemExtensions = pathItem ? extractExtensions(pathItem) : undefined;
  const operationExtensions = extractExtensions(operation);
  const endpointExtensions = mergeExtensions(
    pathItemExtensions,
    operationExtensions,
  );

  // ========================================
  // 7. IREndpointを生成
  // ========================================
  const endpoint: IREndpoint = {
    path: pathTemplate,
    method,
    ...(operation.operationId && { operationId: operation.operationId }),
    ...(operation.summary && { summary: operation.summary }),
    ...(operation.description && { description: operation.description }),
    ...(operation.deprecated && { deprecated: true }),
    tags: operation.tags || [],
    parameters: endpointParameters,
    ...(endpointRequestBody && { requestBody: endpointRequestBody }),
    responses: endpointResponses,
    ...(endpointSecurity && { security: endpointSecurity }),
    ...(endpointExtensions && { extensions: endpointExtensions }),
  };

  return {
    endpoint,
    models: allModels,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("transformOperation", () => {
    it("should create basic endpoint structure", () => {
      const operation: OperationObject = {
        summary: "Get user by ID",
        operationId: "getUserById",
        responses: {
          "200": {
            description: "Success",
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths",
      };

      const result = transformOperation(
        operation,
        "/users/{id}",
        "get",
        context,
      );

      expect(result.endpoint).not.toBeNull();
      expect(result.endpoint?.path).toBe("/users/{id}");
      expect(result.endpoint?.method).toBe("get");
      expect(result.endpoint?.operationId).toBe("getUserById");
      expect(result.endpoint?.summary).toBe("Get user by ID");
    });

    it("should handle operation with description and tags", () => {
      const operation: OperationObject = {
        summary: "Create user",
        description: "Creates a new user in the system",
        tags: ["users"],
        responses: {
          "201": {
            description: "Created",
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post"],
        rootSegment: "paths",
      };

      const result = transformOperation(operation, "/users", "post", context);

      expect(result.endpoint?.description).toBe(
        "Creates a new user in the system",
      );
      expect(result.endpoint?.tags).toEqual(["users"]);
    });

    it("should handle deprecated operation", () => {
      const operation: OperationObject = {
        summary: "Old endpoint",
        deprecated: true,
        responses: {
          "200": {
            description: "Success",
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/legacy", "get"],
        rootSegment: "paths",
      };

      const result = transformOperation(operation, "/legacy", "get", context);

      expect(result.endpoint?.deprecated).toBe(true);
    });

    it("should handle operation without optional fields", () => {
      const operation: OperationObject = {
        responses: {
          "200": {
            description: "Success",
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/minimal", "get"],
        rootSegment: "paths",
      };

      const result = transformOperation(operation, "/minimal", "get", context);

      expect(result.endpoint?.operationId).toBeUndefined();
      expect(result.endpoint?.summary).toBeUndefined();
      expect(result.endpoint?.description).toBeUndefined();
      expect(result.endpoint?.deprecated).toBeUndefined();
      expect(result.endpoint?.tags).toEqual([]);
    });

    // ========================================
    // traversalResult を使用したテスト
    // ========================================
    it("should process parameters and generate parameter model", () => {
      const operation: OperationObject = {
        summary: "Get user by ID",
        operationId: "getUserById",
        responses: {
          "200": {
            description: "Success",
          },
        },
      };

      const traversalResult: OperationTraversalResult = {
        parametersResult: {
          parameters: [
            {
              name: "id",
              in: "path",
              type: "string",
              required: true,
            },
          ],
          childModels: [],
        },
        childModels: [],
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths",
      };

      const result = transformOperation(
        operation,
        "/users/{id}",
        "get",
        context,
        undefined,
        traversalResult,
      );

      // 統合モデルが生成される
      expect(result.models).toHaveLength(1);
      expect(result.models[0].kind).toBe("parameter");
      if (result.models[0].kind === "parameter") {
        expect(result.models[0].name).toBe("GetUsersIdParams");
      }

      // endpoint.parametersは参照になる
      expect(result.endpoint?.parameters).toEqual({
        kind: "ref",
        name: "#/paths/::users::{id}/get/GetUsersIdParams",
      });
    });

    it("should handle empty parameters", () => {
      const operation: OperationObject = {
        responses: {
          "200": {
            description: "Success",
          },
        },
      };

      const traversalResult: OperationTraversalResult = {
        childModels: [],
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get"],
        rootSegment: "paths",
      };

      const result = transformOperation(
        operation,
        "/users",
        "get",
        context,
        undefined,
        traversalResult,
      );

      // パラメータモデルは生成されない
      expect(result.models).toHaveLength(0);

      // endpoint.parametersは空配列
      expect(result.endpoint?.parameters).toEqual([]);
    });

    it("should process requestBody", () => {
      const operation: OperationObject = {
        summary: "Create user",
        responses: {
          "201": {
            description: "Created",
          },
        },
      };

      const traversalResult: OperationTraversalResult = {
        requestBodyResult: {
          required: true,
          description: "User data",
          content: {
            content: [
              {
                mimeType: "application/json",
                schema: { kind: "ref", name: "#/test" },
              },
            ],
            childModels: [],
            requiresSpecialModel: false,
          },
        },
        childModels: [],
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post"],
        rootSegment: "paths",
      };

      const result = transformOperation(
        operation,
        "/users",
        "post",
        context,
        undefined,
        traversalResult,
      );

      expect(result.endpoint?.requestBody).toBeDefined();
      if (
        result.endpoint?.requestBody &&
        result.endpoint.requestBody.kind === "content"
      ) {
        expect(result.endpoint.requestBody.required).toBe(true);
        expect(result.endpoint.requestBody.description).toBe("User data");
        expect(result.endpoint.requestBody.content).toHaveLength(1);
      }
    });

    it("should process responses", () => {
      const operation: OperationObject = {
        summary: "Get user",
        responses: {},
      };

      const traversalResult: OperationTraversalResult = {
        responsesResult: {
          responses: [
            {
              statusCode: "200",
              description: "Success",
              content: [
                {
                  mimeType: "application/json",
                  schema: "string",
                },
              ],
            },
          ],
          childModels: [],
        },
        childModels: [],
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths",
      };

      const result = transformOperation(
        operation,
        "/users/{id}",
        "get",
        context,
        undefined,
        traversalResult,
      );

      expect(result.endpoint?.responses).toHaveLength(1);
      expect(result.endpoint?.responses[0].kind).toBe("content");
      if (result.endpoint?.responses[0].kind === "content") {
        expect(result.endpoint.responses[0].statusCode).toBe("200");
        expect(result.endpoint.responses[0].description).toBe("Success");
      }
    });

    it("should collect all child models", () => {
      const operation: OperationObject = {
        summary: "Create item",
        responses: {},
      };

      const mockParamModel: IRModel = {
        kind: "array",
        name: "Tags",
        referencePath: "#/param",
        itemType: "string",
      };

      const mockRequestModel: IRModel = {
        kind: "object",
        name: "RequestModel",
        referencePath: "#/request",
        properties: [],
      };

      const mockResponseModel: IRModel = {
        kind: "object",
        name: "ResponseModel",
        referencePath: "#/response",
        properties: [],
      };

      const traversalResult: OperationTraversalResult = {
        parametersResult: {
          parameters: [],
          childModels: [mockParamModel],
        },
        requestBodyResult: {
          content: {
            content: [],
            childModels: [mockRequestModel],
            requiresSpecialModel: false,
          },
        },
        responsesResult: {
          responses: [],
          childModels: [mockResponseModel],
        },
        // traverserがすべての子モデルを収集する
        childModels: [mockParamModel, mockRequestModel, mockResponseModel],
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/items", "post"],
        rootSegment: "paths",
      };

      const result = transformOperation(
        operation,
        "/items",
        "post",
        context,
        undefined,
        traversalResult,
      );

      // すべての子モデルが収集される
      expect(result.models).toHaveLength(3);
      expect(result.models).toContain(mockParamModel);
      expect(result.models).toContain(mockRequestModel);
      expect(result.models).toContain(mockResponseModel);
    });

    it("should handle operation with security", () => {
      const operation: OperationObject = {
        summary: "Secure operation",
        security: [{ ApiKey: [] }, { OAuth2: ["read:pets", "write:pets"] }],
        responses: {
          "200": { description: "Success" },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/secure", "get"],
        rootSegment: "paths",
      };

      const result = transformOperation(operation, "/secure", "get", context);

      expect(result.endpoint?.security).toBeDefined();
      expect(result.endpoint?.security).toHaveLength(2);
      expect(result.endpoint?.security?.[0]).toEqual({
        scheme: "ApiKey",
      });
      expect(result.endpoint?.security?.[1]).toEqual({
        scheme: "OAuth2",
        scopes: ["read:pets", "write:pets"],
      });
    });

    it("should merge PathItem and Operation extensions (Operation priority)", () => {
      const operation: OperationObject = {
        summary: "Test operation",
        "x-operation-ext": "operation-value",
        "x-shared": "operation-wins",
        responses: {
          "200": { description: "Success" },
        },
      } as OperationObject;

      const pathItem = {
        "x-path-ext": "path-value",
        "x-shared": "path-loses",
      } as PathItemObject;

      const context: VisitorContext = {
        documentPath: ["paths", "/test", "get"],
        rootSegment: "paths",
      };

      const result = transformOperation(
        operation,
        "/test",
        "get",
        context,
        undefined,
        undefined,
        pathItem,
      );

      expect(result.endpoint?.extensions).toEqual({
        "x-path-ext": "path-value",
        "x-operation-ext": "operation-value",
        "x-shared": "operation-wins",
      });
    });

    it("should handle operation with only PathItem extensions", () => {
      const operation: OperationObject = {
        summary: "Test operation",
        responses: {
          "200": { description: "Success" },
        },
      };

      const pathItem = {
        "x-path-only": "value",
      } as PathItemObject;

      const context: VisitorContext = {
        documentPath: ["paths", "/test", "get"],
        rootSegment: "paths",
      };

      const result = transformOperation(
        operation,
        "/test",
        "get",
        context,
        undefined,
        undefined,
        pathItem,
      );

      expect(result.endpoint?.extensions).toEqual({
        "x-path-only": "value",
      });
    });
  });
}
