/**
 * responses-components-visitor.ts - components.responsesを処理
 *
 * OpenAPIのcomponents.responsesセクションを処理し、
 * 各レスポンス定義をIRResponseに変換する。
 *
 * 責務:
 * - ResponseObjectをIRResponseに変換
 * - $ref参照を保持（入れ子$refは未対応）
 * - referencePath設定によるトレーサビリティ確保
 */

import { consola } from "consola";
import type {
  IRModel,
  IRResponse,
  ReferenceObject,
  ResponseObject,
} from "../../../types";
import { isIRResponseWithContent } from "../../../types/ir/endpoints/response";
import { isReferenceObject } from "../../../types";
import type { ComponentsResponseContext } from "../../types";
import { visitResponse } from "../operations/response-visitor";

/**
 * components.responsesを処理してIRResponseマップに変換
 *
 * @param responses - components.responsesオブジェクト
 * @returns IRResponseマップ
 *
 * @example OpenAPI YAML
 * ```yaml
 * components:
 *   responses:
 *     BadRequest:
 *       description: Bad Request - Invalid input
 *       content:
 *         application/problem+json:
 *           schema:
 *             $ref: '#/components/schemas/Problem'
 *     Unauthorized:
 *       description: Unauthorized - Authentication required
 *       headers:
 *         WWW-Authenticate:
 *           description: Authentication header
 *           schema:
 *             type: string
 * ```
 */
export function visitComponentsResponses(
  responses: Record<string, ResponseObject | ReferenceObject>,
): Record<string, IRResponse> {
  const irResponses: Record<string, IRResponse> = {};
  const allModels: IRModel[] = []; // 後で統合が必要な場合のため

  for (const [name, response] of Object.entries(responses)) {
    // null/undefinedチェック
    if (!response) {
      consola.warn(
        `Invalid response for "${name}": response is null or undefined`,
      );
      continue;
    }

    try {
      // $ref参照の場合は警告を出してスキップ
      if (isReferenceObject(response)) {
        consola.warn(
          `Nested $ref in components.responses["${name}"] is not supported: ${response.$ref}`,
        );
        continue;
      }

      // visitResponseを使用してIRResponseに変換
      const context: ComponentsResponseContext = {
        kind: "componentsResponse",
        documentPath: ["components", "responses", name],
        rootSegment: "components",
      };

      const result = visitResponse(response, context);

      if (result && result.response) {
        irResponses[name] = {
          ...result.response,
        };

        // モデルは現時点では統合しない（将来の拡張ポイント）
        allModels.push(...result.models);
      }
    } catch (error) {
      consola.warn(`Failed to process response "${name}":`, error);
    }
  }

  return irResponses;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitComponentsResponses", () => {
    it("should process basic response definition", () => {
      const responses = {
        BadRequest: {
          description: "Bad Request - Invalid input",
          content: {
            "application/problem+json": {
              schema: {
                $ref: "#/components/schemas/Problem",
              },
            },
          },
        },
      } as Record<string, ResponseObject>;

      const result = visitComponentsResponses(responses);

      expect(result).toHaveProperty("BadRequest");
      expect(result.BadRequest).toEqual({
        kind: "content",
        statusCode: "200",
        description: "Bad Request - Invalid input",
        content: [
          {
            mimeType: "application/problem+json",
            schema: {
              kind: "ref",
              name: "#/components/schemas/Problem",
            },
          },
        ],
      });
    });

    it("should handle response without content", () => {
      const responses = {
        NoContent: {
          description: "No Content",
        },
      } as Record<string, ResponseObject>;

      const result = visitComponentsResponses(responses);

      expect(result).toHaveProperty("NoContent");
      expect(result.NoContent).toEqual({
        kind: "content",
        statusCode: "200",
        description: "No Content",
      });
    });

    it("should warn and skip nested $ref responses", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const responses = {
        RefResponse: {
          $ref: "#/components/responses/BaseResponse",
        },
      } as Record<string, ReferenceObject>;

      const result = visitComponentsResponses(responses);

      expect(result).not.toHaveProperty("RefResponse");
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Nested $ref in components.responses["RefResponse"] is not supported',
        ),
      );

      warnSpy.mockRestore();
    });

    it("should warn and skip null responses", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const responses = {
        Invalid: null,
        Valid: {
          description: "Valid response",
        },
      } as unknown as Record<string, ResponseObject>;

      const result = visitComponentsResponses(responses);

      expect(result).not.toHaveProperty("Invalid");
      expect(result).toHaveProperty("Valid");
      expect(warnSpy).toHaveBeenCalledWith(
        'Invalid response for "Invalid": response is null or undefined',
      );

      warnSpy.mockRestore();
    });

    it("should handle multiple responses", () => {
      const responses = {
        BadRequest: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        Unauthorized: {
          description: "Unauthorized",
        },
      } as Record<string, ResponseObject>;

      const result = visitComponentsResponses(responses);

      expect(Object.keys(result)).toEqual(["BadRequest", "Unauthorized"]);

      if (isIRResponseWithContent(result.BadRequest)) {
        expect(result.BadRequest.description).toBe("Bad Request");
      }

      if (isIRResponseWithContent(result.Unauthorized)) {
        expect(result.Unauthorized.description).toBe("Unauthorized");
      }
    });
  });
}
