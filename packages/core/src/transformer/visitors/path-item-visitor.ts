/**
 * path-item-visitor.ts - PathItemObjectを処理してIREndpoint[]に変換
 *
 * OpenAPIのPathItemObject（特定パスのエンドポイント定義）を処理し、
 * 各HTTPメソッドごとのエンドポイントを抽出する。
 *
 * 責務:
 * - PathItemObjectから各HTTPメソッド（GET/POST/PUT等）の操作を抽出
 * - 各操作をoperation-visitorに委譲してIREndpointに変換
 * - パラメータの継承（PathItem共通パラメータ）の処理
 */

import type { PathItemObject } from "../../types/index";
import type { IREndpoint, IRModel } from "../../types/ir/index";
import type { OperationContext, PathItemContext } from "../types";
import { visitOperation } from "./operation-visitor";

/**
 * サポートするHTTPメソッドの配列
 */
const HTTP_METHODS = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
] as const;

/**
 * PathItemObjectを処理してIREndpoint[]に変換
 *
 * @param pathItem - OpenAPIのPathItemObject
 * @param context - PathItem用のコンテキスト（パステンプレート含む）
 * @returns 抽出されたエンドポイントの配列
 *
 * @example OpenAPI YAML
 * ```yaml
 * /pets/{id}:
 *   parameters:  # 共通パラメータ
 *     - name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *   get:
 *     operationId: getPet
 *     tags: [pets]
 *   put:
 *     operationId: updatePet
 *     tags: [pets]
 *   delete:
 *     operationId: deletePet
 *     tags: [pets]
 * ```
 */
/**
 * PathItemの結果（タグ情報を含む）
 */
export interface PathItemEndpoint {
  endpoint: IREndpoint;
  tags?: string[];
  /** インラインスキーマから抽出されたモデル（オブジェクト、列挙型、配列、マップを統一） */
  models?: IRModel[];
}

export function visitPathItem(
  pathItem: PathItemObject,
  context: PathItemContext,
): PathItemEndpoint[] {
  const results: PathItemEndpoint[] = [];

  // 各HTTPメソッドを処理
  for (const method of HTTP_METHODS) {
    const operation = pathItem[method];
    if (operation && typeof operation === "object") {
      const operationContext: OperationContext = {
        documentPath: [...context.documentPath, method],
        method,
        pathTemplate: context.pathTemplate,
        rootSegment: "paths",
      };

      const operationResult = visitOperation(operation, operationContext);
      if (operationResult) {
        results.push({
          endpoint: operationResult.endpoint,
          tags: operation.tags, // tagsを保持（undefinedをそのまま渡す）
          models: operationResult.models,
        });
      }
    }
  }

  // TODO: Step 12で共通パラメータの処理を実装
  // if (pathItem.parameters) { ... }

  return results;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("visitPathItem", () => {
    it("should extract GET operation", () => {
      const pathItem: PathItemObject = {
        get: {
          operationId: "getPet",
          tags: ["pets"],
          responses: {
            "200": { description: "Success" },
          },
        },
      };

      const context: PathItemContext = {
        documentPath: ["paths", "/pets/{id}"],
        rootSegment: "paths",
        pathTemplate: "/pets/{id}",
      };

      const result = visitPathItem(pathItem, context);

      // Red Phase: このテストは失敗する
      expect(result).toEqual([
        {
          endpoint: {
            operationId: "getPet",
            method: "get",
            path: "/pets/{id}",
            summary: null,
            description: null,
            parameters: [],
            requestBody: null,
            responses: [
              {
                statusCode: "200",
                description: "Success",
                content: null,
                headers: null,
              },
            ],
            deprecated: null,
            security: null,
          },
          tags: ["pets"],
          models: [],
        },
      ]);
    });

    it("should extract multiple HTTP methods", () => {
      const pathItem: PathItemObject = {
        get: {
          operationId: "getPet",
          responses: {},
        },
        put: {
          operationId: "updatePet",
          responses: {},
        },
        delete: {
          operationId: "deletePet",
          responses: {},
        },
      };

      const context: PathItemContext = {
        documentPath: ["paths", "/pets/{id}"],
        rootSegment: "paths",
        pathTemplate: "/pets/{id}",
      };

      const result = visitPathItem(pathItem, context);

      // Red Phase: このテストは失敗する
      expect(result).toEqual([
        {
          endpoint: {
            operationId: "getPet",
            method: "get",
            path: "/pets/{id}",
            summary: null,
            description: null,
            parameters: [],
            requestBody: null,
            responses: [],
            deprecated: null,
            security: null,
          },
          tags: undefined,
          models: [],
        },
        {
          endpoint: {
            operationId: "updatePet",
            method: "put",
            path: "/pets/{id}",
            summary: null,
            description: null,
            parameters: [],
            requestBody: null,
            responses: [],
            deprecated: null,
            security: null,
          },
          tags: undefined,
          models: [],
        },
        {
          endpoint: {
            operationId: "deletePet",
            method: "delete",
            path: "/pets/{id}",
            summary: null,
            description: null,
            parameters: [],
            requestBody: null,
            responses: [],
            deprecated: null,
            security: null,
          },
          tags: undefined,
          models: [],
        },
      ]);
    });

    it("should skip operations that are undefined", () => {
      const pathItem: PathItemObject = {
        get: {
          operationId: "getPet",
          responses: {},
        },
        // postとputは未定義
        // post: undefined,
        // put: undefined,
      };

      const context: PathItemContext = {
        documentPath: ["paths", "/pets/{id}"],
        rootSegment: "paths",
        pathTemplate: "/pets/{id}",
      };

      const result = visitPathItem(pathItem, context);

      // Red Phase: このテストは失敗する
      expect(result).toEqual([
        {
          endpoint: {
            operationId: "getPet",
            method: "get",
            path: "/pets/{id}",
            summary: null,
            description: null,
            parameters: [],
            requestBody: null,
            responses: [],
            deprecated: null,
            security: null,
          },
          tags: undefined,
          models: [],
        },
      ]);
    });

    it("should handle path with common parameters", () => {
      const pathItem: PathItemObject = {
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        get: {
          operationId: "getPet",
          responses: {},
        },
      };

      const context: PathItemContext = {
        documentPath: ["paths", "/pets/{id}"],
        rootSegment: "paths",
        pathTemplate: "/pets/{id}",
      };

      const result = visitPathItem(pathItem, context);

      // Red Phase: このテストは失敗する（パラメータはStep 12で実装）
      expect(result).toEqual([
        {
          endpoint: {
            operationId: "getPet",
            method: "get",
            path: "/pets/{id}",
            summary: null,
            description: null,
            parameters: [],
            requestBody: null,
            responses: [],
            deprecated: null,
            security: null,
          },
          tags: undefined,
          models: [],
        },
      ]);
      // パラメータの処理は今回のスコープ外
    });
  });
}
