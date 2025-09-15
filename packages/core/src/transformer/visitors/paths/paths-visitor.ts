/**
 * paths-visitor.ts - PathsObjectを処理してIREndpoint[]に変換
 *
 * OpenAPIのpathsセクションを処理し、
 * エンドポイントとインラインモデルを抽出する。
 *
 * 責務:
 * - PathsObjectのイテレーション
 * - 各PathItemObjectの処理をpath-item-visitorに委譲
 * - IREndpoint[]とIRModel[]の生成
 */

import type {
  PathsObject,
  PathItemObject,
  IREndpoint,
  IRModel,
} from "../../../types";
import type { PathItemContext, VisitorContext } from "../../types";
import { visitPathItem } from "./path-item-visitor";

/**
 * Paths処理の結果
 */
export interface PathsResult {
  /** 抽出されたエンドポイント */
  endpoints: IREndpoint[];
  /** インラインスキーマから抽出されたモデル（オブジェクト、列挙型、配列、マップを統一） */
  models: IRModel[];
}

/**
 * PathsObjectを処理してIREndpoint[]に変換
 *
 * @param paths - OpenAPIのPathsObject
 * @param context - Visitorコンテキスト
 * @returns エンドポイントとモデルの配列
 *
 * @example OpenAPI YAML
 * ```yaml
 * paths:
 *   /pets:
 *     get:
 *       tags: [pets]
 *       operationId: listPets
 *   /pets/{id}:
 *     get:
 *       tags: [pets]
 *       operationId: getPet
 *   /users:
 *     get:
 *       tags: [users]
 *       operationId: listUsers
 * ```
 */
export function visitPaths(
  paths: PathsObject,
  context: VisitorContext,
): PathsResult {
  const endpoints: IREndpoint[] = [];
  const models: IRModel[] = [];

  // 各パスを処理
  for (const [pathTemplate, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    const pathItemContext: PathItemContext = {
      documentPath: [...context.documentPath, pathTemplate],
      pathTemplate,
      rootSegment: "paths",
    };

    const results = visitPathItem(pathItem, pathItemContext);

    // エンドポイントとモデルを収集
    for (const result of results) {
      endpoints.push(result.endpoint);

      // インラインモデル収集（オブジェクト、列挙型、配列、マップを統一）
      if (result.models) {
        models.push(...result.models);
      }
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

  describe("visitPaths", () => {
    it("should extract a simple GET endpoint", () => {
      const paths: PathsObject = {
        "/pets": {
          get: {
            operationId: "listPets",
            tags: ["pets"],
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
      const result = visitPaths(paths, context);

      expect(result).toEqual({
        endpoints: [
          {
            operationId: "listPets",
            method: "get",
            path: "/pets",
            summary: null,
            description: null,
            tags: ["pets"],
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
        ],
        models: [],
      });
    });

    it("should extract multiple endpoints", () => {
      const paths: PathsObject = {
        "/pets": {
          get: {
            operationId: "listPets",
            tags: ["pets"],
            responses: {},
          },
        },
        "/pets/{id}": {
          get: {
            operationId: "getPet",
            tags: ["pets"],
            responses: {},
          },
        },
        "/users": {
          get: {
            operationId: "listUsers",
            tags: ["users"],
            responses: {},
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths"],
        rootSegment: "paths",
      };
      const result = visitPaths(paths, context);

      expect(result.endpoints).toHaveLength(3);
      expect(result.endpoints.map((e) => e.operationId)).toEqual([
        "listPets",
        "getPet",
        "listUsers",
      ]);
    });

    it("should handle endpoints without tags", () => {
      const paths: PathsObject = {
        "/health": {
          get: {
            operationId: "healthCheck",
            // tagsなし
            responses: {
              "200": { description: "OK" },
            },
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths"],
        rootSegment: "paths",
      };
      const result = visitPaths(paths, context);

      expect(result.endpoints[0].tags).toEqual([]);
    });

    it("should skip null path items", () => {
      const paths: PathsObject = {
        "/valid": {
          get: {
            operationId: "validOp",
            responses: {},
          },
        },
        "/null": null as unknown as PathItemObject,
      };

      const context: VisitorContext = {
        documentPath: ["paths"],
        rootSegment: "paths",
      };
      const result = visitPaths(paths, context);

      expect(result.endpoints).toHaveLength(1);
      expect(result.endpoints[0].operationId).toBe("validOp");
    });
  });
}
