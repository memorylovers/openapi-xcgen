/**
 * サービスインポート文生成
 */

import type { IREndpoint, IRModel } from "@openapi-xcgen/core";
import { getEndpointDataTypes } from "./services-data-types";
import { resolveModelName } from "../../helpers/model-resolver";

/**
 * サービスファイルのインポート文を生成
 * @param endpoints - エンドポイント配列
 * @param models - IRモデルリスト（型名解決用）
 * @returns インポート文字列
 */
export function generateServicesImports(
  endpoints: IREndpoint[],
  models: readonly IRModel[],
): string {
  const lines: string[] = [];

  // clientのインポート（servicesはservices/ディレクトリ内なので相対パス）
  lines.push('import { request } from "../client";');
  lines.push(
    'import type { XcgenApiError as _XcgenApiError } from "../client";',
  );

  // 型定義のインポート（必要な型のみ）
  const importedTypes = new Set<string>();
  for (const endpoint of endpoints) {
    if (endpoint.operationId) {
      // エンドポイントのデータ型情報を取得
      const dataTypes = getEndpointDataTypes(endpoint, models);

      // パラメータ型をインポート
      if (dataTypes.parameterType) {
        importedTypes.add(dataTypes.parameterType);
      }

      // リクエストボディ型をインポート
      // ただし、parameterTypeとrequestBodyTypeの両方がある場合、
      // services-function.tsではparameterTypeのみが使用されるため、
      // requestBodyTypeはインポートしない
      if (dataTypes.requestBodyType && !dataTypes.parameterType) {
        importedTypes.add(dataTypes.requestBodyType);
      }

      // レスポンス型をインポート（成功レスポンス2xxのみ）
      const successResponse = endpoint.responses.find((r) =>
        r.statusCode.startsWith("2"),
      );
      if (successResponse?.kind === "content" && successResponse.content) {
        for (const content of successResponse.content) {
          if (
            typeof content.schema !== "string" &&
            content.schema.kind === "ref"
          ) {
            // IRモデルリストから正しいモデル名を逆引き
            const modelName = resolveModelName(content.schema.name, models);
            importedTypes.add(modelName);
          }
        }
      }
    }
  }

  if (importedTypes.size > 0) {
    const types = Array.from(importedTypes).join(", ");
    // Import types for use in this file（型定義はmodels/index.tsから）
    lines.push(`import type { ${types} } from "../models/index";`);
    // Re-export types for user convenience
    lines.push(`export type { ${types} } from "../models/index";`);
  }

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("services-imports", () => {
    describe("generateServicesImports", () => {
      it("should generate client imports", () => {
        const endpoints: IREndpoint[] = [];

        const result = generateServicesImports(endpoints, []);

        expect(result).toEqual(
          `
import { request } from "../client";
import type { XcgenApiError as _XcgenApiError } from "../client";
`.trim(),
        );
      });

      it("should generate type imports for endpoints", () => {
        const endpoints: IREndpoint[] = [
          {
            path: "/pets/{petId}",
            method: "get",
            operationId: "getPet",
            tags: [],
            parameters: [],
            responses: [
              {
                kind: "content",
                statusCode: "200",
                description: "Success",
                content: [
                  {
                    mimeType: "application/json",
                    schema: { kind: "ref", name: "Pet" },
                  },
                ],
              },
            ],
          },
        ];

        const result = generateServicesImports(endpoints, []);

        expect(result).toEqual(
          `
import { request } from "../client";
import type { XcgenApiError as _XcgenApiError } from "../client";
import type { Pet } from "../models/index";
export type { Pet } from "../models/index";
`.trim(),
        );
      });

      it("should handle endpoints without operationId", () => {
        const endpoints: IREndpoint[] = [
          {
            path: "/test",
            method: "get",
            tags: [],
            parameters: [],
            responses: [],
          },
        ];

        const result = generateServicesImports(endpoints, []);

        expect(result).toEqual(
          `
import { request } from "../client";
import type { XcgenApiError as _XcgenApiError } from "../client";
`.trim(),
        );
      });

      it("should only import success response types, not error types", () => {
        const endpoints: IREndpoint[] = [
          {
            path: "/bookings",
            method: "get",
            operationId: "getBookings",
            tags: [],
            parameters: [],
            responses: [
              {
                kind: "content",
                statusCode: "200",
                description: "Success",
                content: [
                  {
                    mimeType: "application/json",
                    schema: { kind: "ref", name: "GetBookings200Response" },
                  },
                ],
              },
              {
                kind: "content",
                statusCode: "400",
                description: "Bad Request",
                content: [
                  {
                    mimeType: "application/json",
                    schema: { kind: "ref", name: "Problem" },
                  },
                ],
              },
            ],
          },
        ];

        const result = generateServicesImports(endpoints, []);

        // Should only import GetBookings200Response, not Problem
        expect(result).toEqual(
          `
import { request } from "../client";
import type { XcgenApiError as _XcgenApiError } from "../client";
import type { GetBookings200Response } from "../models/index";
export type { GetBookings200Response } from "../models/index";
`.trim(),
        );
      });
    });
  });
}
