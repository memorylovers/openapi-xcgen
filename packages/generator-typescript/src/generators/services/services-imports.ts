/**
 * サービスインポート文生成
 */

import type { IREndpoint } from "@openapi-xcgen/core";
import { toTypeName } from "../../helpers/naming.js";

/**
 * サービスファイルのインポート文を生成
 * @param endpoints - エンドポイント配列
 * @returns インポート文字列
 */
export function generateServicesImports(endpoints: IREndpoint[]): string {
  const lines: string[] = [];

  // clientのインポート
  lines.push('import { request } from "./client.js";');
  lines.push('import type { XcgenApiError } from "./client.js";');

  // 型定義のインポート（必要な型のみ）
  const importedTypes = new Set<string>();
  for (const endpoint of endpoints) {
    if (endpoint.operationId) {
      // パラメータ型
      const dataTypeName = `${toTypeName(endpoint.operationId)}Data`;
      importedTypes.add(dataTypeName);

      // レスポンス型
      for (const response of endpoint.responses) {
        if (response.kind === "content" && response.content) {
          for (const content of response.content) {
            if (
              typeof content.schema !== "string" &&
              content.schema.kind === "ref"
            ) {
              importedTypes.add(toTypeName(content.schema.name));
            }
          }
        }
      }
    }
  }

  if (importedTypes.size > 0) {
    lines.push(
      `import type { ${Array.from(importedTypes).join(", ")} } from "./types.js";`,
    );
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
import { request } from "./client.js";
import type { XcgenApiError } from "./client.js";
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
import { request } from "./client.js";
import type { XcgenApiError } from "./client.js";
import type { GetPetData, Pet } from "./types.js";
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
import { request } from "./client.js";
import type { XcgenApiError } from "./client.js";
`.trim(),
        );
      });
    });
  });
}
