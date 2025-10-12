/**
 * API関数生成
 */

import type { IREndpoint } from "@openapi-xcgen/core";
import { toFunctionName, toTypeName } from "../../helpers/naming.js";
import { getResponseType } from "./services-response-type.js";

/**
 * IREndpointからAPI関数を生成
 * @param endpoint - IRエンドポイント
 * @returns TypeScript関数コード
 */
export function generateServiceFunction(endpoint: IREndpoint): string | null {
  if (!endpoint.operationId) {
    return null;
  }

  const lines: string[] = [];
  const functionName = toFunctionName(endpoint.operationId);
  const dataTypeName = `${toTypeName(endpoint.operationId)}Data`;

  // JSDocコメント
  lines.push("/**");
  if (endpoint.summary) {
    lines.push(` * ${endpoint.summary}`);
  }
  if (endpoint.description) {
    lines.push(` * ${endpoint.description}`);
  }
  lines.push(` * @param options - Request parameters`);
  lines.push(` * @param init - Additional fetch options`);

  // レスポンスの型を取得
  const responseType = getResponseType(endpoint);
  lines.push(` * @returns ${responseType}`);
  lines.push(
    ` * @throws {XcgenApiError} API error with status and response details`,
  );

  if (endpoint.deprecated) {
    lines.push(` * @deprecated`);
  }

  lines.push(" */");

  // 関数シグネチャ
  lines.push(`export async function ${functionName}(`);
  lines.push(`  options: ${dataTypeName},`);
  lines.push(`  init?: RequestInit,`);
  lines.push(`): Promise<${responseType}> {`);

  // 関数本体
  lines.push(`  return request({`);
  lines.push(`    method: "${endpoint.method.toUpperCase()}",`);
  lines.push(`    path: "${endpoint.path}",`);
  lines.push(`    options,`);
  lines.push(`    init,`);
  lines.push(`  });`);
  lines.push(`}`);

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("services-function", () => {
    describe("generateServiceFunction", () => {
      it("should generate function with operationId", () => {
        const endpoint: IREndpoint = {
          path: "/users",
          method: "get",
          operationId: "getUsers",
          summary: "Get all users",
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
                  schema: {
                    kind: "array",
                    itemType: { kind: "ref", name: "User" },
                  },
                },
              ],
            },
          ],
        };

        const result = generateServiceFunction(endpoint);

        expect(result).toEqual(
          `
/**
 * Get all users
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns Array<User>
 * @throws {XcgenApiError} API error with status and response details
 */
export async function getUsers(
  options: GetUsersData,
  init?: RequestInit,
): Promise<Array<User>> {
  return request({
    method: "GET",
    path: "/users",
    options,
    init,
  });
}
`.trim(),
        );
      });

      it("should return null when operationId is missing", () => {
        const endpoint: IREndpoint = {
          path: "/test",
          method: "get",
          tags: [],
          parameters: [],
          responses: [],
        };

        const result = generateServiceFunction(endpoint);

        expect(result).toBeNull();
      });

      it("should handle void response", () => {
        const endpoint: IREndpoint = {
          path: "/logout",
          method: "post",
          operationId: "logout",
          tags: [],
          parameters: [],
          responses: [
            {
              kind: "content",
              statusCode: "204",
              description: "No content",
            },
          ],
        };

        const result = generateServiceFunction(endpoint);

        expect(result).toEqual(
          `
/**
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns void
 * @throws {XcgenApiError} API error with status and response details
 */
export async function logout(
  options: LogoutData,
  init?: RequestInit,
): Promise<void> {
  return request({
    method: "POST",
    path: "/logout",
    options,
    init,
  });
}
`.trim(),
        );
      });
    });
  });
}
