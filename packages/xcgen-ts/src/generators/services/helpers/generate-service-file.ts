/**
 * サービスファイル生成
 *
 * タグ別のエンドポイントグループからサービスファイルを生成
 */

import type { IREndpoint } from "@openapi-xcgen/core";
import type { HookableInstance } from "../../../hooks";
import { generateServicesImports } from "../services-imports";
import { generateEndpoint } from "../services-endpoint";

/**
 * タグ別のサービスファイルを生成
 *
 * @param tag - タグ名
 * @param endpoints - そのタグに属するエンドポイント配列
 * @param hooks - Hook instance（オプション）
 * @returns サービスファイルのコード
 *
 * @example
 * ```typescript
 * const endpoints: IREndpoint[] = [
 *   { operationId: "getPet", ... },
 *   { operationId: "createPet", ... }
 * ];
 * generateServiceFile("pets", endpoints);
 * // => "/**\n * pets service functions\n * ...\n *\/\n\nimport { request } from '../client';\n\nexport async function getPet(...) { ... }"
 * ```
 */
export function generateServiceFile(
  tag: string,
  endpoints: IREndpoint[],
  hooks?: HookableInstance,
): string {
  const lines: string[] = [];

  lines.push("/**");
  lines.push(` * ${tag} service functions`);
  lines.push(" * Auto-generated from OpenAPI specification");
  lines.push(" */");
  lines.push("");

  // インポート文
  lines.push(generateServicesImports(endpoints));
  lines.push("");

  // 各エンドポイントを関数に変換
  for (const endpoint of endpoints) {
    if (endpoint.operationId) {
      const functionCode = generateEndpoint(endpoint, hooks);
      if (functionCode) {
        lines.push(functionCode);
        lines.push("");
      }
    }
  }

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("generateServiceFile", () => {
    it("should generate service file with header", () => {
      const endpoints: IREndpoint[] = [
        {
          path: "/pets/{petId}",
          method: "get",
          operationId: "getPet",
          tags: ["pets"],
          parameters: [],
          responses: [
            {
              kind: "content",
              statusCode: "200",
              description: "Success",
              content: [
                {
                  mimeType: "application/json",
                  schema: { kind: "ref", name: "#/components/schemas/Pet" },
                },
              ],
            },
          ],
        },
      ];

      const result = generateServiceFile("pets", endpoints);

      expect(result).toContain("/**");
      expect(result).toContain(" * pets service functions");
      expect(result).toContain(" * Auto-generated from OpenAPI specification");
      expect(result).toContain(" */");
      expect(result).toContain('import { request } from "../client";');
      expect(result).toContain("export async function getPet");
    });

    it("should generate multiple functions for multiple endpoints", () => {
      const endpoints: IREndpoint[] = [
        {
          path: "/pets",
          method: "get",
          operationId: "getPets",
          tags: ["pets"],
          parameters: [],
          responses: [],
        },
        {
          path: "/pets/{petId}",
          method: "get",
          operationId: "getPet",
          tags: ["pets"],
          parameters: [],
          responses: [],
        },
      ];

      const result = generateServiceFile("pets", endpoints);

      expect(result).toContain("export async function getPets");
      expect(result).toContain("export async function getPet");
    });

    it("should skip endpoints without operationId", () => {
      const endpoints: IREndpoint[] = [
        {
          path: "/pets",
          method: "get",
          // operationId なし
          tags: ["pets"],
          parameters: [],
          responses: [],
        },
      ];

      const result = generateServiceFile("pets", endpoints);

      expect(result).toContain(" * pets service functions");
      expect(result).not.toContain("export async function");
    });

    it("should handle default tag", () => {
      const endpoints: IREndpoint[] = [
        {
          path: "/health",
          method: "get",
          operationId: "healthCheck",
          tags: [],
          parameters: [],
          responses: [],
        },
      ];

      const result = generateServiceFile("default", endpoints);

      expect(result).toContain(" * default service functions");
      expect(result).toContain("export async function healthCheck");
    });
  });
}
