/**
 * paths-visitor.ts - PathsObjectを処理してIRService[]に変換
 *
 * OpenAPIのpathsセクションを処理し、
 * エンドポイントをタグでグループ化してサービスとして分類する。
 *
 * 責務:
 * - PathsObjectのイテレーション
 * - 各PathItemObjectの処理をpath-item-visitorに委譲
 * - エンドポイントのタグによるグループ化
 * - IRService[]の生成
 */

import type { PathsObject } from "../../types/index";
import type { IRModel, IRService } from "../../types/ir/index";
import type { VisitorContext } from "../types";
import { visitPathItem, type PathItemContext } from "./path-item-visitor";

/**
 * Paths処理の結果
 */
export interface PathsResult {
  /** 抽出されたサービス（タグでグループ化） */
  services: IRService[];
  /** インラインスキーマから抽出されたモデル（オブジェクト、列挙型、配列、マップを統一） */
  models: IRModel[];
}

/**
 * PathsObjectを処理してIRService[]に変換
 *
 * @param paths - OpenAPIのPathsObject
 * @param context - Visitorコンテキスト
 * @returns タグでグループ化されたサービス配列
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
  const serviceMap = new Map<string, IRService>();
  const models: IRModel[] = [];

  // 各パスを処理
  for (const [pathTemplate, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    const pathItemContext: PathItemContext = {
      documentPath: [...context.documentPath, pathTemplate],
      pathTemplate,
    };

    const results = visitPathItem(pathItem, pathItemContext);

    // エンドポイントをタグでグループ化、インラインモデルを収集
    for (const result of results) {
      // tagsが指定されていない場合は'default'を使用
      const tag = result.tags?.[0] || "default";

      if (!serviceMap.has(tag)) {
        serviceMap.set(tag, {
          name: tag,
          endpoints: [],
        });
      }

      serviceMap.get(tag)!.endpoints.push(result.endpoint);

      // インラインモデル収集（オブジェクト、列挙型、配列、マップを統一）
      if (result.models) {
        models.push(...result.models);
      }
    }
  }

  return {
    services: Array.from(serviceMap.values()),
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
      };
      const result = visitPaths(paths, context);

      // Red Phase: このテストは失敗する
      expect(result.services).toHaveLength(1);
      expect(result.services[0]).toEqual({
        name: "pets",
        endpoints: [
          expect.objectContaining({
            id: "listPets",
            method: "get",
            path: "/pets",
          }),
        ],
      });
    });

    it("should group endpoints by tags", () => {
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
      };
      const result = visitPaths(paths, context);

      // Red Phase: このテストは失敗する
      expect(result.services).toHaveLength(2);

      const petsService = result.services.find((s) => s.name === "pets");
      expect(petsService?.endpoints).toHaveLength(2);

      const usersService = result.services.find((s) => s.name === "users");
      expect(usersService?.endpoints).toHaveLength(1);
    });

    it("should use 'default' tag for endpoints without tags", () => {
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
      };
      const result = visitPaths(paths, context);

      // Red Phase: このテストは失敗する
      expect(result.services).toHaveLength(1);
      expect(result.services[0].name).toBe("default");
    });
  });
}
