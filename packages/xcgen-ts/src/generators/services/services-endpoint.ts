/**
 * API関数生成
 */

import type { IREndpoint, IRComponent } from "@openapi-xcgen/core";
import { toFunctionName } from "../../helpers/naming";
import type { HookableInstance, TsCodeEndpoint } from "../../hooks";
import { getResponseType } from "./services-response-type";
import { getEndpointDataTypes } from "./services-data-types";

/**
 * IREndpointからAPI関数を生成
 * @param endpoint - IRエンドポイント
 * @param models - IRコンポーネントリスト（型名解決用）
 * @param hooks - Hook instance（オプション）
 * @returns TypeScript関数コード（null: 生成スキップ）
 */
export function generateEndpoint(
  endpoint: IREndpoint,
  models: readonly IRComponent[],
  hooks?: HookableInstance,
): string | null {
  if (!endpoint.operationId) {
    return null;
  }

  // 1. 関数コードを生成
  const functionName = toFunctionName(endpoint.operationId);
  const functionCode = generateFunctionCode(endpoint, functionName, models);

  // 2. TsCodeEndpoint を初期化（Hookが変更可能）
  const tsCode: TsCodeEndpoint = {
    functionName,
    code: functionCode,
    imports: [],
    comment: generateJSDocComment(endpoint, models),
  };

  // 3. endpoint:generate Hook を呼び出し
  if (hooks) {
    hooks.callHook("endpoint:generate", {
      endpoint,
      tsCode,
      extensions: "extensions" in endpoint ? endpoint.extensions : undefined,
    });

    // Hook で関数名が変更された場合、コード内の関数名も置換
    if (tsCode.functionName !== functionName) {
      tsCode.code = tsCode.code.replace(
        new RegExp(`\\bfunction ${functionName}\\b`, "g"),
        `function ${tsCode.functionName}`,
      );
    }
  }

  // 4. 最終的なコードを返す（コメントは不要、関数コード自体にJSDocが含まれる）
  return tsCode.code;
}

/**
 * JSDocコメントを生成
 */
function generateJSDocComment(
  endpoint: IREndpoint,
  models: readonly IRComponent[],
): string {
  const lines: string[] = [];
  const dataTypes = getEndpointDataTypes(endpoint, models);
  const responseType = getResponseType(endpoint, models);

  if (endpoint.summary) {
    lines.push(endpoint.summary);
  }
  if (endpoint.description) {
    lines.push(endpoint.description);
  }

  // パラメータ情報
  if (dataTypes.needsDataType) {
    lines.push("@param options - Request parameters");
  }
  lines.push("@param init - Additional fetch options");
  lines.push(`@returns ${responseType}`);
  lines.push(
    "@throws {_XcgenApiError} API error with status and response details",
  );

  if (endpoint.deprecated) {
    lines.push("@deprecated");
  }

  return lines.join("\n");
}

/**
 * 関数コード本体を生成
 */
function generateFunctionCode(
  endpoint: IREndpoint,
  functionName: string,
  models: readonly IRComponent[],
): string {
  const lines: string[] = [];
  const dataTypes = getEndpointDataTypes(endpoint, models);
  const responseType = getResponseType(endpoint, models);

  // JSDocコメント
  lines.push("/**");
  if (endpoint.summary) {
    lines.push(` * ${endpoint.summary}`);
  }
  if (endpoint.description) {
    lines.push(` * ${endpoint.description}`);
  }

  if (dataTypes.needsDataType) {
    lines.push(` * @param options - Request parameters`);
  }
  lines.push(` * @param init - Additional fetch options`);
  lines.push(` * @returns ${responseType}`);
  lines.push(
    ` * @throws {_XcgenApiError} API error with status and response details`,
  );

  if (endpoint.deprecated) {
    lines.push(` * @deprecated`);
  }

  lines.push(" */");

  // 関数シグネチャ
  lines.push(`export async function ${functionName}(`);

  if (dataTypes.needsDataType) {
    let dataTypeName: string;
    if (dataTypes.parameterType && dataTypes.requestBodyType) {
      dataTypeName = dataTypes.parameterType;
    } else if (dataTypes.parameterType) {
      dataTypeName = dataTypes.parameterType;
    } else {
      dataTypeName = dataTypes.requestBodyType!;
    }

    lines.push(`  options: ${dataTypeName},`);
  }

  lines.push(`  init?: RequestInit,`);
  lines.push(`): Promise<${responseType}> {`);

  // 関数本体
  lines.push(`  return request({`);
  lines.push(`    method: "${endpoint.method.toUpperCase()}",`);
  lines.push(`    path: "${endpoint.path}",`);

  if (dataTypes.needsDataType) {
    lines.push(`    options,`);
  } else {
    lines.push(`    options: {},`);
  }

  lines.push(`    init,`);
  lines.push(`  });`);
  lines.push(`}`);

  return lines.join("\n");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("services-endpoint", () => {
    describe("generateEndpoint", () => {
      it("should generate function with operationId", () => {
        const models: IRComponent[] = [
          {
            kind: "array",
            name: "GetUsers200Response",
            referencePath:
              "#/paths/::users/get/responses/200/content/application::json/schema",
            itemType: {
              kind: "ref",
              referencePath: "#/components/schemas/User",
            },
          },
        ];

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
                    kind: "ref",
                    referencePath:
                      "#/paths/::users/get/responses/200/content/application::json/schema",
                  },
                },
              ],
            },
          ],
        };

        const result = generateEndpoint(endpoint, models);

        expect(result).toEqual(
          `
/**
 * Get all users
 * @param init - Additional fetch options
 * @returns GetUsers200Response
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function getUsers(
  init?: RequestInit,
): Promise<GetUsers200Response> {
  return request({
    method: "GET",
    path: "/users",
    options: {},
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

        const result = generateEndpoint(endpoint, []);

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

        const result = generateEndpoint(endpoint, []);

        expect(result).toEqual(
          `
/**
 * @param init - Additional fetch options
 * @returns void
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function logout(
  init?: RequestInit,
): Promise<void> {
  return request({
    method: "POST",
    path: "/logout",
    options: {},
    init,
  });
}
`.trim(),
        );
      });
    });
  });
}
