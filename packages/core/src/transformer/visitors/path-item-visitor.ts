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
import type { IREndpoint } from "../../types/ir/index";
import type { VisitorContext } from "../types";
import { visitOperation, type OperationContext } from "./operation-visitor";

/**
 * PathItem処理用の拡張コンテキスト
 */
export interface PathItemContext extends VisitorContext {
  /** パステンプレート（例: "/pets/{id}"） */
  pathTemplate: string;
}

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
        ...context,
        method,
        pathTemplate: context.pathTemplate,
      };

      const endpoint = visitOperation(operation, operationContext);
      if (endpoint) {
        results.push({
          endpoint,
          tags: operation.tags, // tagsを保持
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
  const { createContext } = await import("../types");

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
        ...createContext(),
        pathTemplate: "/pets/{id}",
      };

      const result = visitPathItem(pathItem, context);

      // Red Phase: このテストは失敗する
      expect(result).toHaveLength(1);
      expect(result[0].endpoint).toEqual(
        expect.objectContaining({
          id: "getPet",
          method: "get",
          path: "/pets/{id}",
        }),
      );
      expect(result[0].tags).toEqual(["pets"]);
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
        ...createContext(),
        pathTemplate: "/pets/{id}",
      };

      const result = visitPathItem(pathItem, context);

      // Red Phase: このテストは失敗する
      expect(result).toHaveLength(3);

      const methods = result.map((r) => r.endpoint.method);
      expect(methods).toContain("get");
      expect(methods).toContain("put");
      expect(methods).toContain("delete");
    });

    it("should skip operations that are null or undefined", () => {
      const pathItem: PathItemObject = {
        get: {
          operationId: "getPet",
          responses: {},
        },
        // postがundefined/null
        post: undefined,
        put: undefined,
      } as PathItemObject;

      const context: PathItemContext = {
        ...createContext(),
        pathTemplate: "/pets/{id}",
      };

      const result = visitPathItem(pathItem, context);

      // Red Phase: このテストは失敗する
      expect(result).toHaveLength(1);
      expect(result[0].endpoint.method).toBe("get");
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
        ...createContext(),
        pathTemplate: "/pets/{id}",
      };

      const result = visitPathItem(pathItem, context);

      // Red Phase: このテストは失敗する（パラメータはStep 12で実装）
      expect(result).toHaveLength(1);
      // パラメータの処理は今回のスコープ外
    });
  });
}
