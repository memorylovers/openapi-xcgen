/**
 * API関数生成器
 *
 * IREndpointからTypeScriptのAPI関数を生成する
 */

import type { XcgenIR } from "@openapi-xcgen/core";
import { generateServiceFunction } from "./services-function";
import { generateServicesHeader } from "./services-header";
import { generateServicesImports } from "./services-imports";

/**
 * 生成されたAPI関数コード
 */
export interface GeneratedServices {
  /** 生成されたTypeScriptコード */
  code: string;
  /** 生成されたAPI関数の数 */
  count: number;
}

/**
 * XcgenIRからAPI関数を生成
 * @param ir - 中間表現
 * @returns 生成されたTypeScriptコード
 */
export function generateServices(ir: XcgenIR): GeneratedServices {
  const parts: string[] = [];

  // ファイルヘッダー
  parts.push(generateServicesHeader(ir.metadata));
  parts.push("");

  // インポート文
  parts.push(generateServicesImports(ir.endpoints));
  parts.push("");

  let count = 0;

  // 各エンドポイントを関数に変換
  for (const endpoint of ir.endpoints) {
    if (endpoint.operationId) {
      const functionCode = generateServiceFunction(endpoint);
      if (functionCode) {
        parts.push(functionCode);
        parts.push("");
        count++;
      }
    }
  }

  return {
    code: parts.join("\n"),
    count,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("services generator", () => {
    describe("generateServices", () => {
      it("should generate service functions from XcgenIR", () => {
        const ir: XcgenIR = {
          metadata: {
            title: "Pet Store API",
            version: "1.0.0",
          },
          models: [],
          tags: [],
          endpoints: [
            {
              path: "/pets/{petId}",
              method: "get",
              operationId: "getPet",
              summary: "Get a pet by ID",
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
          ],
        };

        const result = generateServices(ir);

        expect(result.count).toBe(1);
        expect(result.code).toContain("export async function getPet");
        expect(result.code).toContain("init?: RequestInit");
        expect(result.code).toContain("options: {}");
        expect(result.code).toContain("Promise<Pet>");
      });
    });
  });
}
