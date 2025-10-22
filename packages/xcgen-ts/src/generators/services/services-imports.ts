/**
 * サービスインポート文生成
 */

import type { IREndpoint } from "@openapi-xcgen/core";
import { toTypeName } from "../../helpers/naming.js";
import { getEndpointDataTypes } from "./services-data-types.js";

/**
 * サービスファイルのインポート文を生成
 * @param endpoints - エンドポイント配列
 * @returns インポート文字列
 */
export function generateServicesImports(endpoints: IREndpoint[]): string {
  const lines: string[] = [];

  // clientのインポート
  lines.push('import { request } from "./client";');
  lines.push(
    'import type { XcgenApiError as _XcgenApiError } from "./client";',
  );

  // 型定義のインポート（必要な型のみ）
  const importedTypes = new Set<string>();
  for (const endpoint of endpoints) {
    if (endpoint.operationId) {
      // エンドポイントのデータ型情報を取得
      const dataTypes = getEndpointDataTypes(endpoint);

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
            // Core packageはreference path全体を保存: "#/components/schemas/Pet"
            // 最後のセグメントを抽出: "Pet"
            const modelName =
              content.schema.name.split("/").at(-1) ?? content.schema.name;
            importedTypes.add(toTypeName(modelName));
          }
        }
      }
    }
  }

  if (importedTypes.size > 0) {
    const types = Array.from(importedTypes).join(", ");
    // Import types for use in this file
    lines.push(`import type { ${types} } from "./types";`);
    // Re-export types for user convenience
    lines.push(`export type { ${types} } from "./types";`);
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

        const result = generateServicesImports(endpoints);

        expect(result).toEqual(
          `
import { request } from "./client";
import type { XcgenApiError as _XcgenApiError } from "./client";
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

        const result = generateServicesImports(endpoints);

        expect(result).toEqual(
          `
import { request } from "./client";
import type { XcgenApiError as _XcgenApiError } from "./client";
import type { Pet } from "./types";
export type { Pet } from "./types";
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

        const result = generateServicesImports(endpoints);

        expect(result).toEqual(
          `
import { request } from "./client";
import type { XcgenApiError as _XcgenApiError } from "./client";
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

        const result = generateServicesImports(endpoints);

        // Should only import GetBookings200Response, not Problem
        expect(result).toEqual(
          `
import { request } from "./client";
import type { XcgenApiError as _XcgenApiError } from "./client";
import type { GetBookings200Response } from "./types";
export type { GetBookings200Response } from "./types";
`.trim(),
        );
      });
    });
  });
}
