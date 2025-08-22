/**
 * operation-visitor.ts - OperationObjectを処理してIREndpointに変換（基本版）
 *
 * OpenAPIのOperationObject（個別のAPI操作）を処理し、
 * IREndpointに変換する。
 *
 * Step 11では基本的な情報のみ処理:
 * - operationId、summary、description
 * - tags、deprecated
 * - responses（基本的な情報のみ）
 *
 * Step 12で実装予定:
 * - parameters（path/query/header/cookie）
 * - requestBody
 * - responsesの詳細（content、headers等）
 */

import { consola } from "consola";
import type { OperationObject } from "../../types/index.js";
import type { IREndpoint, IRHttpMethod } from "../../types/ir/index.js";
import type { VisitorContext } from "../types.js";

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
 * OperationObjectを処理してIREndpointに変換（基本版）
 *
 * @param operation - OpenAPIのOperationObject
 * @param context - Operation用のコンテキスト
 * @returns IREndpoint、またはnull（operationIdがない場合）
 *
 * @example OpenAPI YAML
 * ```yaml
 * get:
 *   operationId: getPet
 *   summary: Get a pet by ID
 *   description: Returns a single pet
 *   tags: [pets]
 *   deprecated: false
 *   responses:
 *     '200':
 *       description: Success
 * ```
 */
export function visitOperation(
  operation: OperationObject,
  context: OperationContext,
): IREndpoint | null {
  // operationIdは必須
  if (!operation.operationId) {
    consola.warn(
      `Operation without operationId at ${context.method.toUpperCase()} ${
        context.pathTemplate
      }`,
    );
    return null;
  }

  // Red Phase - 型安全な最小実装
  const endpoint: IREndpoint = {
    id: operation.operationId,
    method: context.method as IRHttpMethod, // IRHttpMethodを使用
    path: context.pathTemplate,
    summary: operation.summary,
    description: operation.description,
    parameters: [],
    responses: [],
    deprecated: operation.deprecated,
  };

  // TODO: Step 12で実装予定
  // - parameters処理
  // - requestBody処理
  // - responses詳細処理

  return endpoint;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;
  const { createContext } = await import("../types.js");

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
        ...createContext(),
        method: "get",
        pathTemplate: "/pets/{id}",
      };

      const result = visitOperation(operation, context);

      // Red Phase: このテストは失敗する
      expect(result).not.toBeNull();
      expect(result).toEqual(
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
    });

    it("should handle deprecated operations", () => {
      const operation: OperationObject = {
        operationId: "oldEndpoint",
        deprecated: true,
        responses: {},
      };

      const context: OperationContext = {
        ...createContext(),
        method: "post",
        pathTemplate: "/old/endpoint",
      };

      const result = visitOperation(operation, context);

      // Red Phase: このテストは失敗する
      expect(result).not.toBeNull();
      expect(result?.deprecated).toBe(true);
    });

    it("should return null for operations without operationId", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const operation: OperationObject = {
        // operationIdなし
        summary: "Missing ID",
        responses: {},
      };

      const context: OperationContext = {
        ...createContext(),
        method: "get",
        pathTemplate: "/missing",
      };

      const result = visitOperation(operation, context);

      // このテストは成功する（最小実装がnullを返すため）
      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        "Operation without operationId at GET /missing",
      );

      warnSpy.mockRestore();
    });

    it("should handle operations without tags", () => {
      const operation: OperationObject = {
        operationId: "noTags",
        // tagsなし
        responses: {},
      };

      const context: OperationContext = {
        ...createContext(),
        method: "get",
        pathTemplate: "/no-tags",
      };

      const result = visitOperation(operation, context);

      // Red Phase: このテストは失敗する
      expect(result).not.toBeNull();
      expect(result?.id).toBe("noTags");
      // tagsは含まれないかundefined
    });

    it("should ignore parameters in basic version", () => {
      const operation: OperationObject = {
        operationId: "withParams",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {},
      };

      const context: OperationContext = {
        ...createContext(),
        method: "get",
        pathTemplate: "/with/{id}",
      };

      const result = visitOperation(operation, context);

      // Red Phase: このテストは失敗する
      // Step 11では、parametersは空配列で返す
      expect(result).not.toBeNull();
      expect(result?.parameters).toEqual([]);
    });
  });
}
