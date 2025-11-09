/**
 * エンドポイントのデータ型情報を抽出
 */

import type { IREndpoint, IRComponent } from "@openapi-xcgen/core";
import { resolveModelName } from "../../helpers/model-resolver";
import { irTypeToTsType } from "../../helpers/type-mapper";

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
 * @param models - IRコンポーネントリスト（型名解決用）
 * @returns データ型情報
 *
 * @example
 * ```typescript
 * // パラメータのみ
 * const endpoint: IREndpoint = {
 *   parameters: { kind: "ref", referencePath: "#/paths/.../GetPetsParams" },
 *   ...
 * };
 * const models: IRComponent[] = [...];
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
  models: readonly IRComponent[],
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
      // IRコンポーネントリストから正しいモデル名を逆引き
      parameterType = resolveModelName(
        endpoint.parameters.referencePath,
        models,
      );
    }
  }

  // リクエストボディの型名を抽出
  if (endpoint.requestBody) {
    if (endpoint.requestBody.kind === "content") {
      // Phase 1: Prioritize $ref (structured models)
      for (const content of endpoint.requestBody.content) {
        if (
          typeof content.schema !== "string" &&
          content.schema.kind === "ref"
        ) {
          // IRコンポーネントリストから正しいモデル名を逆引き
          requestBodyType = resolveModelName(
            content.schema.referencePath,
            models,
          );
          break;
        }
      }

      // Phase 2: Fallback to scalar types if no $ref found
      if (!requestBodyType) {
        for (const content of endpoint.requestBody.content) {
          if (typeof content.schema === "string") {
            // スカラー型の場合、TypeScript型名を使用
            requestBodyType = irTypeToTsType(content.schema);
            break;
          }
        }
      }
    } else if (endpoint.requestBody.kind === "ref") {
      // コンポーネント参照の場合（#/components/requestBodies/*）
      requestBodyType = resolveModelName(
        endpoint.requestBody.ref.referencePath,
        models,
      );
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
            referencePath: "#/paths/::pets/get/parameters/GetPetsParams",
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
                  referencePath:
                    "#/paths/::pets/post/requestBody/.../PostPetsRequestBody",
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
            referencePath: "#/paths/.../PutPetsIdParams",
          },
          requestBody: {
            kind: "content",
            required: true,
            content: [
              {
                mimeType: "application/json",
                schema: {
                  kind: "ref",
                  referencePath: "#/paths/.../PutPetsIdRequestBody",
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

      it("should handle requestBody with scalar type (string)", () => {
        const endpoint: IREndpoint = {
          path: "/log",
          method: "post",
          tags: [],
          parameters: [],
          requestBody: {
            kind: "content",
            required: true,
            content: [
              {
                mimeType: "text/plain",
                schema: "string", // スカラー型
              },
            ],
          },
          responses: [],
        };

        const result = getEndpointDataTypes(endpoint, []);

        expect(result).toEqual({
          requestBodyType: "string",
          needsDataType: true,
        });
      });

      it("should handle requestBody with scalar type (binary)", () => {
        const endpoint: IREndpoint = {
          path: "/upload",
          method: "post",
          tags: [],
          parameters: [],
          requestBody: {
            kind: "content",
            required: true,
            content: [
              {
                mimeType: "application/octet-stream",
                schema: "binary", // スカラー型
              },
            ],
          },
          responses: [],
        };

        const result = getEndpointDataTypes(endpoint, []);

        expect(result).toEqual({
          requestBodyType: "Blob",
          needsDataType: true,
        });
      });

      it("should handle requestBody with scalar type (number)", () => {
        const endpoint: IREndpoint = {
          path: "/data",
          method: "post",
          tags: [],
          parameters: [],
          requestBody: {
            kind: "content",
            required: true,
            content: [
              {
                mimeType: "application/json",
                schema: "int", // スカラー型
              },
            ],
          },
          responses: [],
        };

        const result = getEndpointDataTypes(endpoint, []);

        expect(result).toEqual({
          requestBodyType: "number",
          needsDataType: true,
        });
      });

      it("should extract requestBody type from ref (kind: ref)", () => {
        const endpoint: IREndpoint = {
          path: "/users/array",
          method: "post",
          tags: [],
          parameters: [],
          requestBody: {
            kind: "ref",
            ref: {
              kind: "ref",
              referencePath: "#/components/requestBodies/UserArray",
            },
          },
          responses: [],
        };

        const models: IRComponent[] = [
          {
            kind: "array",
            name: "UserArray",
            referencePath:
              "#/components/requestBodies/UserArray/content/application::json/schema",
            itemType: {
              kind: "ref",
              referencePath: "#/components/schemas/User",
            },
          },
        ];

        const result = getEndpointDataTypes(endpoint, models);

        expect(result).toEqual({
          requestBodyType: "UserArray",
          needsDataType: true,
        });
      });

      it("should prioritize $ref over scalar when both exist in content", () => {
        const endpoint: IREndpoint = {
          path: "/users",
          method: "patch",
          tags: [],
          parameters: [],
          requestBody: {
            kind: "content",
            required: true,
            content: [
              {
                mimeType: "text/plain",
                schema: "string", // スカラー型（先に配置）
              },
              {
                mimeType: "application/json",
                schema: {
                  kind: "ref",
                  referencePath: "#/components/schemas/UserUpdate",
                }, // $ref（後に配置）
              },
            ],
          },
          responses: [],
        };

        const result = getEndpointDataTypes(endpoint, []);

        // $refが優先されるべき
        expect(result).toEqual({
          requestBodyType: "UserUpdate",
          needsDataType: true,
        });
      });
    });
  });
}
