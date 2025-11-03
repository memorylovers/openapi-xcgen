/**
 * Responses Traverser - v2 Transformer Architecture
 *
 * Operationのresponsesフィールドを訪問し、
 * 各レスポンスを処理します。
 * content処理はcontent-traverserに、headers処理はheaders-traverserに委譲します。
 */

import type {
  IRComponent,
  IRType,
  ReferenceObject,
  ResponseObject,
  SchemaObjectWithNullable,
} from "../../../types";
import { isReferenceObject } from "../../../types";

// Type alias for responses dictionary
type ResponsesObject = Record<string, ResponseObject | ReferenceObject>;
import type { VisitorContext } from "../../types";
import type { ResponsesTraversalResult } from "../types";
import { traverseContent } from "./content-traverser";
import { traverseHeaders } from "./headers-traverser";

/**
 * スキーマ訪問関数の型
 */
type VisitSchemaFn = (
  schema: SchemaObjectWithNullable | ReferenceObject,
  context: VisitorContext,
) => { type: IRType | null; models: IRComponent[] };

/**
 * responsesフィールド（ステータスコードとResponseObjectのマップ）を訪問
 *
 * @param responses - responsesオブジェクト（例: { "200": {...}, "404": {...} }）
 * @param context - 親コンテキスト
 * @param visitSchema - スキーマ訪問関数（再帰用）
 * @returns ResponsesTraversalResult
 *
 * @example OpenAPI YAML
 * ```yaml
 * responses:
 *   '200':
 *     description: Success
 *     headers:
 *       X-Total-Count:
 *         schema:
 *           type: integer
 *     content:
 *       application/json:
 *         schema:
 *           $ref: '#/components/schemas/User'
 *   '404':
 *     description: Not found
 * ```
 */
export function traverseResponses(
  responses: ResponsesObject | undefined,
  context: VisitorContext,
  visitSchema: VisitSchemaFn,
): ResponsesTraversalResult {
  // responsesが未定義または空の場合
  if (!responses || Object.keys(responses).length === 0) {
    return {
      responses: [],
      childModels: [],
    };
  }

  const visitedResponses: ResponsesTraversalResult["responses"] = [];
  const allChildModels: IRComponent[] = [];

  // 各ステータスコードのレスポンスを訪問
  Object.entries(responses).forEach(([statusCode, response]) => {
    // ReferenceObjectの場合
    if (isReferenceObject(response)) {
      visitedResponses.push({
        statusCode,
        ref: response.$ref,
      });
      return;
    }

    const responseObj = response as ResponseObject;

    // レスポンスコンテキストを作成（まず基本コンテキスト）
    const baseResponseContext: VisitorContext = {
      documentPath: [...context.documentPath, "responses", statusCode],
      rootSegment: context.rootSegment,
    };

    // headersを先に処理（contentに渡すため）
    const headersResult = traverseHeaders(
      responseObj.headers,
      baseResponseContext,
      visitSchema,
    );

    // headersをcontextに含めてcontentを処理
    const contentResult = traverseContent(
      responseObj.content,
      {
        ...baseResponseContext,
        ...(headersResult.headers.length > 0 && {
          headers: headersResult.headers,
        }),
      },
      visitSchema,
    );

    // レスポンス情報を構築
    visitedResponses.push({
      statusCode,
      ...(responseObj.description && { description: responseObj.description }),
      ...(contentResult.content.length > 0 && {
        content: contentResult.content,
      }),
      ...(headersResult.headers.length > 0 && {
        headers: headersResult.headers,
      }),
    });

    // 子モデルを収集
    allChildModels.push(...contentResult.childModels);
    allChildModels.push(...headersResult.childModels);
  });

  return {
    responses: visitedResponses,
    childModels: allChildModels,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("traverseResponses", () => {
    it("should handle empty responses", () => {
      const mockVisitSchema = vi.fn();

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get"],
        rootSegment: "paths",
      };

      const result = traverseResponses({}, context, mockVisitSchema);

      expect(result.responses).toEqual([]);
      expect(result.childModels).toEqual([]);
      expect(mockVisitSchema).not.toHaveBeenCalled();
    });

    it("should handle undefined responses", () => {
      const mockVisitSchema = vi.fn();

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get"],
        rootSegment: "paths",
      };

      const result = traverseResponses(undefined, context, mockVisitSchema);

      expect(result.responses).toEqual([]);
      expect(result.childModels).toEqual([]);
      expect(mockVisitSchema).not.toHaveBeenCalled();
    });

    it("should process single response without content", () => {
      const responses: ResponsesObject = {
        "204": {
          description: "No content",
        },
      };

      const mockVisitSchema = vi.fn();

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{id}", "delete"],
        rootSegment: "paths",
      };

      const result = traverseResponses(responses, context, mockVisitSchema);

      expect(result.responses).toHaveLength(1);
      expect(result.responses[0]).toEqual({
        statusCode: "204",
        description: "No content",
      });
      expect(result.childModels).toEqual([]);
    });

    it("should process response with content", () => {
      const responses: ResponsesObject = {
        "200": {
          description: "Success",
          content: {
            "application/json": {
              schema: { type: "string" },
            },
          },
        },
      };

      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "string",
        models: [],
      });

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths",
      };

      const result = traverseResponses(responses, context, mockVisitSchema);

      expect(result.responses).toHaveLength(1);
      expect(result.responses[0]).toEqual({
        statusCode: "200",
        description: "Success",
        content: [
          {
            mimeType: "application/json",
            schema: "string",
          },
        ],
      });
    });

    it("should process response with headers", () => {
      const responses: ResponsesObject = {
        "200": {
          description: "Success",
          headers: {
            "X-Total-Count": {
              schema: { type: "integer" },
            },
          },
        },
      };

      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "int",
        models: [],
      });

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get"],
        rootSegment: "paths",
      };

      const result = traverseResponses(responses, context, mockVisitSchema);

      expect(result.responses).toHaveLength(1);
      expect(result.responses[0]).toEqual({
        statusCode: "200",
        description: "Success",
        headers: [
          {
            name: "X-Total-Count",
            type: "int",
          },
        ],
      });
    });

    it("should process response with both content and headers", () => {
      const responses: ResponsesObject = {
        "200": {
          description: "Success",
          headers: {
            "X-Rate-Limit": {
              schema: { type: "integer" },
            },
          },
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/User" },
            },
          },
        },
      };

      const mockVisitSchema = vi
        .fn()
        .mockReturnValueOnce({
          type: "int",
          models: [],
        })
        .mockReturnValueOnce({
          type: { kind: "ref", name: "#/components/schemas/User" },
          models: [],
        });

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths",
      };

      const result = traverseResponses(responses, context, mockVisitSchema);

      expect(result.responses).toHaveLength(1);
      expect(result.responses[0]).toEqual({
        statusCode: "200",
        description: "Success",
        content: [
          {
            mimeType: "application/json",
            schema: { kind: "ref", name: "#/components/schemas/User" },
          },
        ],
        headers: [
          {
            name: "X-Rate-Limit",
            type: "int",
          },
        ],
      });
    });

    it("should process multiple responses", () => {
      const responses: ResponsesObject = {
        "200": {
          description: "Success",
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        "404": {
          description: "Not found",
        },
        default: {
          description: "Error",
        },
      };

      const mockVisitSchema = vi.fn().mockReturnValue({
        type: { kind: "ref", name: "#/test" },
        models: [],
      });

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths",
      };

      const result = traverseResponses(responses, context, mockVisitSchema);

      expect(result.responses).toHaveLength(3);
      expect(result.responses[0].statusCode).toBe("200");
      expect(result.responses[1].statusCode).toBe("404");
      expect(result.responses[2].statusCode).toBe("default");
    });

    it("should handle reference response", () => {
      const responses: ResponsesObject = {
        "200": {
          $ref: "#/components/responses/SuccessResponse",
        },
      };

      const mockVisitSchema = vi.fn();

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get"],
        rootSegment: "paths",
      };

      const result = traverseResponses(responses, context, mockVisitSchema);

      expect(result.responses).toHaveLength(1);
      expect(result.responses[0]).toEqual({
        statusCode: "200",
        ref: "#/components/responses/SuccessResponse",
      });
      expect(mockVisitSchema).not.toHaveBeenCalled();
    });

    it("should collect child models from content and headers", () => {
      const mockContentModel: IRComponent = {
        kind: "object",
        name: "ContentModel",
        referencePath: "#/content",
        properties: [],
      };

      const mockHeaderModel: IRComponent = {
        kind: "object",
        name: "HeaderModel",
        referencePath: "#/header",
        properties: [],
      };

      const responses: ResponsesObject = {
        "200": {
          description: "Success",
          headers: {
            "X-Custom": {
              schema: { type: "object" },
            },
          },
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
      };

      const mockVisitSchema = vi
        .fn()
        .mockReturnValueOnce({
          type: { kind: "ref", name: "#/content" },
          models: [mockContentModel],
        })
        .mockReturnValueOnce({
          type: { kind: "ref", name: "#/header" },
          models: [mockHeaderModel],
        });

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get"],
        rootSegment: "paths",
      };

      const result = traverseResponses(responses, context, mockVisitSchema);

      expect(result.childModels).toHaveLength(2);
      expect(result.childModels).toContain(mockContentModel);
      expect(result.childModels).toContain(mockHeaderModel);
    });
  });
}
