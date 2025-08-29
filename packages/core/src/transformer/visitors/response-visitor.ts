/**
 * response-visitor.ts - ResponseObjectをIRResponseに変換
 *
 * OpenAPIのResponseObject（レスポンス定義）を処理し、
 * IRResponseに変換する。
 *
 * 責務:
 * - ステータスコード、descriptionの処理
 * - contentのMIMEタイプごとのスキーマ処理（visitSchemaに委譲）
 * - レスポンスヘッダーの処理
 * - $ref参照の解決（現時点では未実装）
 */

import { consola } from "consola";
import type { ResponseObject, ReferenceObject } from "../../types/index.js";
import type { IRContentMap, IRResponse } from "../../types/ir/index.js";
import type { VisitorContext } from "../types.js";
import { isReferenceObject } from "../../types/guards.js";
import { visitSchema, type SchemaVisitorContext } from "./schema-visitor.js";

/**
 * ResponseObjectをIRResponseに変換
 *
 * @param response - OpenAPIのResponseObjectまたはReferenceObject
 * @param statusCode - HTTPステータスコード
 * @param context - Visitorコンテキスト
 * @returns IRResponse、または変換できない場合はnull
 *
 * @example OpenAPI YAML
 * ```yaml
 * responses:
 *   '200':
 *     description: Success
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             data:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/User"
 *             total:
 *               type: integer
 *     headers:
 *       X-Total-Count:
 *         description: Total number of items
 *         schema:
 *           type: integer
 *   '404':
 *     description: Not found
 * ```
 */
export function visitResponse(
  response: ResponseObject | ReferenceObject,
  statusCode: string,
  _context: VisitorContext,
): IRResponse | null {
  // $ref参照の場合は現時点でスキップ
  if (isReferenceObject(response)) {
    consola.warn(`Reference response not supported yet: ${response.$ref}`);
    return null;
  }

  // contentの処理
  let content: IRContentMap | undefined;
  if (response.content) {
    content = {};
    for (const [mimeType, mediaType] of Object.entries(response.content)) {
      if (mediaType.schema) {
        const schemaContext: SchemaVisitorContext = {
          name: `Response${statusCode}`,
        };
        const schemaResult = visitSchema(mediaType.schema, schemaContext);
        if (schemaResult.type) {
          content[mimeType] = schemaResult.type;
        }
      }
    }
    // 空のcontentは返さない
    if (Object.keys(content).length === 0) {
      content = undefined;
    }
  }

  // TODO: headersの処理（Step 12で実装予定）

  return {
    statusCode,
    description: response.description,
    content,
    // headers: undefined, // TODO: headersの処理
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;
  const { createContext } = await import("../types.js");

  describe("visitResponse", () => {
    it("should handle basic response without content", () => {
      const response: ResponseObject = {
        description: "Success",
      };

      const result = visitResponse(response, "200", createContext());

      expect(result).toEqual({
        statusCode: "200",
        description: "Success",
        content: undefined,
      });
    });

    it("should handle response with JSON content", () => {
      const response: ResponseObject = {
        description: "User list",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                users: {
                  type: "array",
                  items: { type: "string" },
                },
              },
            },
          },
        },
      };

      const result = visitResponse(response, "200", createContext());

      expect(result).not.toBeNull();
      expect(result?.statusCode).toBe("200");
      expect(result?.content).toBeDefined();
      expect(result?.content?.["application/json"]).toBeDefined();
    });

    it("should handle response with multiple content types", () => {
      const response: ResponseObject = {
        description: "Multi-format response",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: { type: "string" },
              },
            },
          },
          "application/xml": {
            schema: {
              type: "object",
              properties: {
                data: { type: "string" },
              },
            },
          },
          "text/plain": {
            schema: { type: "string" },
          },
        },
      };

      const result = visitResponse(response, "200", createContext());

      expect(result?.content).toBeDefined();
      expect(Object.keys(result?.content || {})).toHaveLength(3);
    });

    it("should handle response with headers", () => {
      const response: ResponseObject = {
        description: "Success with headers",
        headers: {
          "X-Total-Count": {
            description: "Total number of items",
            schema: { type: "integer" },
          },
          "X-Rate-Limit": {
            schema: { type: "integer" },
          },
        },
      };

      const result = visitResponse(response, "200", createContext());

      expect(result).not.toBeNull();
      // TODO: headersの処理はStep 12で実装
      // expect(result?.headers).toBeDefined();
    });

    it("should warn and return null for reference response", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const response: ReferenceObject = {
        $ref: "#/components/responses/NotFound",
      };

      const result = visitResponse(response, "404", createContext());

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        "Reference response not supported yet: #/components/responses/NotFound",
      );

      warnSpy.mockRestore();
    });

    it("should handle 4xx and 5xx error responses", () => {
      const response: ResponseObject = {
        description: "Bad Request",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
      };

      const result = visitResponse(response, "400", createContext());

      expect(result?.statusCode).toBe("400");
      expect(result?.description).toBe("Bad Request");
      expect(result?.content?.["application/json"]).toBeDefined();
    });
  });
}
