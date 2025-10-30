/**
 * エンドポイントのデータ型情報を抽出
 */

import type { IREndpoint, IRModel } from "@openapi-xcgen/core";
import { resolveModelName } from "../../helpers/model-resolver";

/**
 * エンドポイントのデータ型情報
 */
export interface EndpointDataTypes {
  /** パラメータ型名（存在する場合） */
  parameterType?: string;
  /** リクエストボディ型名（存在する場合） */
  requestBodyType?: string;
  /** データ型が必要かどうか */
  needsDataType: boolean;
}

/**
 * IREndpointからデータ型情報を抽出
 * @param endpoint - IRエンドポイント
 * @param models - IRモデルリスト（型名解決用）
 * @returns データ型情報
 *
 * @example
 * ```typescript
 * // パラメータのみ
 * const endpoint: IREndpoint = {
 *   parameters: { kind: "ref", name: "#/paths/.../GetPetsParams" },
 *   ...
 * };
 * const models: IRModel[] = [...];
 * const result = getEndpointDataTypes(endpoint, models);
 * // => { parameterType: "GetPetsParams", needsDataType: true }
 *
 * // パラメータなし
 * const endpoint: IREndpoint = {
 *   parameters: [],
 *   ...
 * };
 * const result = getEndpointDataTypes(endpoint, models);
 * // => { needsDataType: false }
 * ```
 */
export function getEndpointDataTypes(
  endpoint: IREndpoint,
  models: readonly IRModel[],
): EndpointDataTypes {
  let parameterType: string | undefined;
  let requestBodyType: string | undefined;

  // パラメータの型名を抽出
  if (!Array.isArray(endpoint.parameters)) {
    // プリミティブ型（文字列リテラル）をスキップ
    if (
      typeof endpoint.parameters !== "string" &&
      endpoint.parameters.kind === "ref"
    ) {
      // IRモデルリストから正しいモデル名を逆引き
      parameterType = resolveModelName(endpoint.parameters.name, models);
    }
  }

  // リクエストボディの型名を抽出
  if (endpoint.requestBody && endpoint.requestBody.kind === "content") {
    for (const content of endpoint.requestBody.content) {
      if (typeof content.schema !== "string" && content.schema.kind === "ref") {
        // IRモデルリストから正しいモデル名を逆引き
        requestBodyType = resolveModelName(content.schema.name, models);
        break; // 最初のスキーマのみ使用
      }
    }
  }

  const needsDataType = Boolean(parameterType || requestBodyType);

  return {
    parameterType,
    requestBodyType,
    needsDataType,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("services-data-types", () => {
    describe("getEndpointDataTypes", () => {
      it("should extract parameter type from IRRef", () => {
        const endpoint: IREndpoint = {
          path: "/pets",
          method: "get",
          tags: [],
          parameters: {
            kind: "ref",
            name: "#/paths/::pets/get/parameters/GetPetsParams",
          },
          responses: [],
        };

        const result = getEndpointDataTypes(endpoint, []);

        expect(result).toEqual({
          parameterType: "GetPetsParams",
          needsDataType: true,
        });
      });

      it("should return no type for empty parameters array", () => {
        const endpoint: IREndpoint = {
          path: "/users",
          method: "get",
          tags: [],
          parameters: [],
          responses: [],
        };

        const result = getEndpointDataTypes(endpoint, []);

        expect(result).toEqual({
          needsDataType: false,
        });
      });

      it("should extract requestBody type from content", () => {
        const endpoint: IREndpoint = {
          path: "/pets",
          method: "post",
          tags: [],
          parameters: [],
          requestBody: {
            kind: "content",
            required: true,
            content: [
              {
                mimeType: "application/json",
                schema: {
                  kind: "ref",
                  name: "#/paths/::pets/post/requestBody/.../PostPetsRequestBody",
                },
              },
            ],
          },
          responses: [],
        };

        const result = getEndpointDataTypes(endpoint, []);

        expect(result).toEqual({
          requestBodyType: "PostPetsRequestBody",
          needsDataType: true,
        });
      });

      it("should extract both parameter and requestBody types", () => {
        const endpoint: IREndpoint = {
          path: "/pets/{id}",
          method: "put",
          tags: [],
          parameters: {
            kind: "ref",
            name: "#/paths/.../PutPetsIdParams",
          },
          requestBody: {
            kind: "content",
            required: true,
            content: [
              {
                mimeType: "application/json",
                schema: {
                  kind: "ref",
                  name: "#/paths/.../PutPetsIdRequestBody",
                },
              },
            ],
          },
          responses: [],
        };

        const result = getEndpointDataTypes(endpoint, []);

        expect(result).toEqual({
          parameterType: "PutPetsIdParams",
          requestBodyType: "PutPetsIdRequestBody",
          needsDataType: true,
        });
      });

      it("should handle endpoint with no parameters and no requestBody", () => {
        const endpoint: IREndpoint = {
          path: "/health",
          method: "get",
          tags: [],
          parameters: [],
          responses: [],
        };

        const result = getEndpointDataTypes(endpoint, []);

        expect(result).toEqual({
          needsDataType: false,
        });
      });

      it("should handle requestBody without schema ref", () => {
        const endpoint: IREndpoint = {
          path: "/test",
          method: "post",
          tags: [],
          parameters: [],
          requestBody: {
            kind: "content",
            required: true,
            content: [
              {
                mimeType: "application/json",
                schema: "string", // プリミティブ型は文字列リテラル
              },
            ],
          },
          responses: [],
        };

        const result = getEndpointDataTypes(endpoint, []);

        expect(result).toEqual({
          needsDataType: false,
        });
      });
    });
  });
}
