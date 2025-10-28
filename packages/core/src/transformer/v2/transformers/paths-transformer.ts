/**
 * Paths Transformer - v2 Transformer Architecture
 *
 * PathsObjectを処理し、すべてのエンドポイント（IREndpoint）を抽出します。
 * 各operationの処理はoperation-transformerに委譲します。
 */

import { consola } from "consola";
import type {
  IREndpoint,
  IRHttpMethod,
  IRModel,
  PathsObject,
} from "../../../types";
import type { VisitorContext } from "../../types";
import { dispatchOperation } from "../dispatchers/operation-dispatcher";

/**
 * PathsObjectの変換結果
 */
export interface PathsTransformResult {
  /** 抽出されたエンドポイントの配列 */
  endpoints: IREndpoint[];
  /** 抽出されたモデルの配列 */
  models: IRModel[];
}

/**
 * HTTPメソッドのリスト
 */
const HTTP_METHODS: IRHttpMethod[] = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "head",
  "options",
  "trace",
];

/**
 * PathsObjectを処理してエンドポイントとモデルを抽出
 *
 * @param paths - PathsObject
 * @param rootContext - ルートコンテキスト
 * @returns PathsTransformResult
 *
 * @example OpenAPI YAML
 * ```yaml
 * paths:
 *   /users:
 *     get:
 *       summary: Get all users
 *       responses:
 *         '200':
 *           description: Success
 *   /users/{id}:
 *     get:
 *       summary: Get user by ID
 *       parameters:
 *         - name: id
 *           in: path
 *           required: true
 *           schema:
 *             type: string
 * ```
 */
export function transformPaths(
  paths: PathsObject,
  rootContext: VisitorContext,
): PathsTransformResult {
  const endpoints: IREndpoint[] = [];
  const models: IRModel[] = [];

  // 各パステンプレートを処理
  for (const [pathTemplate, pathItem] of Object.entries(paths)) {
    if (!pathItem) {
      consola.warn(`Empty path item for: ${pathTemplate}`);
      continue;
    }

    // 各HTTPメソッドを処理
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) {
        continue;
      }

      // operationコンテキストを作成
      const operationContext: VisitorContext = {
        documentPath: [...rootContext.documentPath, pathTemplate, method],
        rootSegment: rootContext.rootSegment,
      };

      // operation-dispatcherを呼び出してエンドポイントとモデルを取得
      const operationResult = dispatchOperation(
        operation,
        pathTemplate,
        method,
        operationContext,
        pathItem.parameters, // PathItem レベルのパラメータ
      );

      if (operationResult.endpoint) {
        endpoints.push(operationResult.endpoint);
      }
      models.push(...operationResult.models);
    }
  }

  return {
    endpoints,
    models,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("transformPaths", () => {
    it("should handle empty paths object", () => {
      const paths: PathsObject = {};

      const context: VisitorContext = {
        documentPath: ["paths"],
        rootSegment: "paths",
      };

      const result = transformPaths(paths, context);

      expect(result.endpoints).toEqual([]);
      expect(result.models).toEqual([]);
    });

    it("should iterate over path templates", () => {
      const paths: PathsObject = {
        "/users": {
          get: {
            summary: "Get all users",
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
        },
        "/users/{id}": {
          get: {
            summary: "Get user by ID",
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
              },
            ],
            responses: {
              "200": {
                description: "Success",
              },
            },
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths"],
        rootSegment: "paths",
      };

      const result = transformPaths(paths, context);

      // operation-dispatcherの統合により、実際のエンドポイントが生成される
      expect(result.endpoints).toHaveLength(2);
      expect(result.endpoints[0].path).toBe("/users");
      expect(result.endpoints[0].method).toBe("get");
      expect(result.endpoints[1].path).toBe("/users/{id}");
      expect(result.endpoints[1].method).toBe("get");
      // 現時点ではoperation-transformerがスケルトンなので、modelsは空
      expect(result.models).toEqual([]);
    });

    it("should handle multiple HTTP methods on same path", () => {
      const paths: PathsObject = {
        "/users": {
          get: {
            summary: "Get all users",
            responses: { "200": { description: "Success" } },
          },
          post: {
            summary: "Create user",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                    },
                  },
                },
              },
            },
            responses: { "201": { description: "Created" } },
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths"],
        rootSegment: "paths",
      };

      const result = transformPaths(paths, context);

      // operation-dispatcherの統合により、2つのエンドポイントが生成される
      expect(result.endpoints).toHaveLength(2);
      expect(result.endpoints[0].path).toBe("/users");
      expect(result.endpoints[0].method).toBe("get");
      expect(result.endpoints[1].path).toBe("/users");
      expect(result.endpoints[1].method).toBe("post");
      // 現時点ではoperation-transformerがスケルトンなので、modelsは空
      expect(result.models).toEqual([]);
    });

    it("should skip undefined path items", () => {
      const paths = {
        "/users": {
          get: {
            responses: { "200": { description: "Success" } },
          },
        },
        "/invalid": undefined,
      } as unknown as PathsObject;

      const context: VisitorContext = {
        documentPath: ["paths"],
        rootSegment: "paths",
      };

      const result = transformPaths(paths, context);

      // undefinedのパスはスキップされ、有効なパスのみ処理される
      expect(result.endpoints).toHaveLength(1);
      expect(result.endpoints[0].path).toBe("/users");
      expect(result.models).toEqual([]);
    });

    it("should handle paths with only non-operation fields", () => {
      const paths: PathsObject = {
        "/users": {
          summary: "Users endpoint",
          description: "Operations for users",
          // HTTPメソッドなし
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths"],
        rootSegment: "paths",
      };

      const result = transformPaths(paths, context);

      // HTTPメソッドがないので、エンドポイントは生成されない
      expect(result.endpoints).toEqual([]);
      expect(result.models).toEqual([]);
    });
  });
}
