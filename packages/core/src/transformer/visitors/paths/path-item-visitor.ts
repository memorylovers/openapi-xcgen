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

import type { IREndpoint, IRModel, PathItemObject } from "../../../types";
import type { OperationContext, PathItemContext } from "../../types";
import { visitOperation } from "../operations/operation-visitor";

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
 * PathItemの結果
 */
export interface PathItemResult {
  endpoint: IREndpoint;
  /** インラインスキーマから抽出されたモデル（オブジェクト、列挙型、配列、マップを統一） */
  models?: IRModel[];
}

export function visitPathItem(
  pathItem: PathItemObject,
  context: PathItemContext,
): PathItemResult[] {
  const results: PathItemResult[] = [];

  // PathItemレベルの共通パラメータを取得
  const commonParameters = pathItem.parameters || undefined;

  // 各HTTPメソッドを処理
  for (const method of HTTP_METHODS) {
    const operation = pathItem[method];
    if (operation && typeof operation === "object") {
      const operationContext: OperationContext = {
        kind: "operation",
        documentPath: [...context.documentPath, method],
        method,
        pathTemplate: context.pathTemplate,
        rootSegment: "paths",
        commonParameters, // 共通パラメータを渡す
      };

      const operationResult = visitOperation(operation, operationContext);
      if (operationResult) {
        results.push({
          endpoint: operationResult.endpoint,
          models: operationResult.models,
        });
      }
    }
  }

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
        kind: "pathItem",
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
            tags: ["pets"],
            parameters: [],
            responses: [
              {
                kind: "content",
                statusCode: "200",
                description: "Success",
              },
            ],
          },
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
        kind: "pathItem",
        documentPath: ["paths", "/pets/{id}"],
        rootSegment: "paths",
        pathTemplate: "/pets/{id}",
      };

      const result = visitPathItem(pathItem, context);

      expect(result).toEqual([
        {
          endpoint: {
            operationId: "getPet",
            method: "get",
            path: "/pets/{id}",
            tags: [],
            parameters: [],
            responses: [],
          },
          models: [],
        },
        {
          endpoint: {
            operationId: "updatePet",
            method: "put",
            path: "/pets/{id}",
            tags: [],
            parameters: [],
            responses: [],
          },
          models: [],
        },
        {
          endpoint: {
            operationId: "deletePet",
            method: "delete",
            path: "/pets/{id}",
            tags: [],
            parameters: [],
            responses: [],
          },
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
        kind: "pathItem",
        documentPath: ["paths", "/pets/{id}"],
        rootSegment: "paths",
        pathTemplate: "/pets/{id}",
      };

      const result = visitPathItem(pathItem, context);

      expect(result).toEqual([
        {
          endpoint: {
            operationId: "getPet",
            method: "get",
            path: "/pets/{id}",
            tags: [],
            parameters: [],
            responses: [],
          },
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
        kind: "pathItem",
        documentPath: ["paths", "/pets/{id}"],
        rootSegment: "paths",
        pathTemplate: "/pets/{id}",
      };

      const result = visitPathItem(pathItem, context);

      // 共通パラメータが継承されているはず
      // パラメータが存在する場合は、統合モデルへの参照になる
      expect(result).toEqual([
        {
          endpoint: {
            operationId: "getPet",
            method: "get",
            path: "/pets/{id}",
            tags: [],
            parameters: {
              kind: "ref",
              name: "#/paths/::pets::{id}/get/parameters/GetPetsIdParams",
            },
            responses: [],
          },
          models: [
            {
              kind: "parameter",
              name: "GetPetsIdParams",
              description: "Parameters for GET /pets/{id}",
              referencePath:
                "#/paths/::pets::{id}/get/parameters/GetPetsIdParams",
              properties: [
                {
                  name: "id",
                  type: "string",
                  in: "path",
                  required: true,
                },
              ],
            },
          ],
        },
      ]);
    });

    it("should inherit common parameters to multiple operations", () => {
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
        put: {
          operationId: "updatePet",
          responses: {},
        },
      };

      const context: PathItemContext = {
        kind: "pathItem",
        documentPath: ["paths", "/pets/{id}"],
        rootSegment: "paths",
        pathTemplate: "/pets/{id}",
      };

      const result = visitPathItem(pathItem, context);

      // 両方のOperationに共通パラメータが継承されているはず
      expect(result).toEqual([
        {
          endpoint: {
            operationId: "getPet",
            method: "get",
            path: "/pets/{id}",
            tags: [],
            parameters: {
              kind: "ref",
              name: "#/paths/::pets::{id}/get/parameters/GetPetsIdParams",
            },
            responses: [],
          },
          models: [
            {
              kind: "parameter",
              name: "GetPetsIdParams",
              description: "Parameters for GET /pets/{id}",
              referencePath:
                "#/paths/::pets::{id}/get/parameters/GetPetsIdParams",
              properties: [
                {
                  name: "id",
                  type: "string",
                  in: "path",
                  required: true,
                },
              ],
            },
          ],
        },
        {
          endpoint: {
            operationId: "updatePet",
            method: "put",
            path: "/pets/{id}",
            tags: [],
            parameters: {
              kind: "ref",
              name: "#/paths/::pets::{id}/put/parameters/PutPetsIdParams",
            },
            responses: [],
          },
          models: [
            {
              kind: "parameter",
              name: "PutPetsIdParams",
              description: "Parameters for PUT /pets/{id}",
              referencePath:
                "#/paths/::pets::{id}/put/parameters/PutPetsIdParams",
              properties: [
                {
                  name: "id",
                  type: "string",
                  in: "path",
                  required: true,
                },
              ],
            },
          ],
        },
      ]);
    });

    it("should allow operation to override common parameters", () => {
      const pathItem: PathItemObject = {
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Common parameter",
          },
        ],
        get: {
          operationId: "getPet",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Overridden parameter",
            },
          ],
          responses: {},
        },
      };

      const context: PathItemContext = {
        kind: "pathItem",
        documentPath: ["paths", "/pets/{id}"],
        rootSegment: "paths",
        pathTemplate: "/pets/{id}",
      };

      const result = visitPathItem(pathItem, context);

      // Operationレベルのパラメータが優先されるはず
      expect(result).toEqual([
        {
          endpoint: {
            operationId: "getPet",
            method: "get",
            path: "/pets/{id}",
            tags: [],
            parameters: {
              kind: "ref",
              name: "#/paths/::pets::{id}/get/parameters/GetPetsIdParams",
            },
            responses: [],
          },
          models: [
            {
              kind: "parameter",
              name: "GetPetsIdParams",
              description:
                "Parameters for GET /pets/{id}\nid: Overridden parameter",
              referencePath:
                "#/paths/::pets::{id}/get/parameters/GetPetsIdParams",
              properties: [
                {
                  name: "id",
                  type: "string",
                  in: "path",
                  required: true,
                  description: "Overridden parameter",
                },
              ],
            },
          ],
        },
      ]);
    });
  });
}
