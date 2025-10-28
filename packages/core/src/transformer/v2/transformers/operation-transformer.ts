/**
 * Operation Transformer - v2 Transformer Architecture
 *
 * OperationObjectをIREndpointに変換します。
 * parameters, requestBody, responsesの処理はそれぞれのtraverserに委譲します。
 *
 * このファイルはPhase 6で骨格のみ作成し、Phase 7でtraverserと統合します。
 */

import { consola } from "consola";
import type {
  IREndpoint,
  IRHttpMethod,
  IRModel,
  OperationObject,
  ParameterObject,
} from "../../../types";
import type { VisitorContext } from "../../types";
import type { OperationTraversalResult } from "../types";

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
 * OperationObjectをIREndpointに変換
 *
 * @param operation - OperationObject
 * @param pathTemplate - パステンプレート（例: "/users/{id}"）
 * @param method - HTTPメソッド
 * @param context - Visitorコンテキスト
 * @param pathItemParameters - PathItemレベルのパラメータ（オプション）
 * @param traversalResult - operation-traverserからの結果（Phase 7で実装）
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
  pathItemParameters?: ParameterObject[],
  traversalResult?: OperationTraversalResult,
): OperationTransformResult {
  consola.debug(
    `Transforming operation: ${method.toUpperCase()} ${pathTemplate}`,
  );

  // TODO: Phase 7で実装
  // 1. parametersをマージ（PathItemとOperation）
  // 2. parameter-aggregatorでパラメータ統合モデルを生成
  // 3. requestBodyを変換
  // 4. responsesを変換
  // 5. すべてを統合してIREndpointを生成

  // 仮実装：基本情報のみを使用
  const endpoint: IREndpoint = {
    path: pathTemplate,
    method,
    ...(operation.operationId && { operationId: operation.operationId }),
    ...(operation.summary && { summary: operation.summary }),
    ...(operation.description && { description: operation.description }),
    ...(operation.deprecated && { deprecated: true }),
    tags: operation.tags || [],
    parameters: [], // TODO: Phase 7で実装
    responses: [], // TODO: Phase 7で実装
  };

  return {
    endpoint,
    models: [], // TODO: Phase 7で実装
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

    // TODO: Phase 7で追加のテストを実装
    // - parametersの処理
    // - requestBodyの処理
    // - responsesの処理
    // - パラメータ統合モデルの生成
    // - 子モデルの収集
  });
}
