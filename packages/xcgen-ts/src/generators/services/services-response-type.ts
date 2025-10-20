/**
 * レスポンス型取得
 */

import type { IREndpoint } from "@openapi-xcgen/core";
import { toTypeName } from "../../helpers/naming.js";
import { irTypeToTsType } from "../../helpers/type-mapper.js";

/**
 * エンドポイントからレスポンス型を取得
 * @param endpoint - IRエンドポイント
 * @returns TypeScript型文字列
 */
export function getResponseType(endpoint: IREndpoint): string {
  // 成功レスポンス（2xx）を探す
  const successResponse = endpoint.responses.find((r) =>
    r.statusCode.startsWith("2"),
  );

  // contentがない、またはref型の場合
  if (!successResponse) {
    return "void";
  }

  if (successResponse.kind === "ref") {
    // Core packageはreference path全体を保存: "#/components/schemas/User"
    // 最後のセグメントを抽出: "User"
    const modelName =
      successResponse.ref.name.split("/").at(-1) ?? successResponse.ref.name;
    return toTypeName(modelName);
  }

  if (!successResponse.content || successResponse.content.length === 0) {
    return "void";
  }

  // application/jsonのcontentを優先
  const jsonContent = successResponse.content.find((c) =>
    c.mimeType.includes("json"),
  );

  const content = jsonContent || successResponse.content[0];
  return irTypeToTsType(content.schema);
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("services-response-type", () => {
    describe("getResponseType", () => {
      it("should return void for no responses", () => {
        const endpoint: IREndpoint = {
          path: "/test",
          method: "get",
          operationId: "test",
          tags: [],
          parameters: [],
          responses: [],
        };

        const result = getResponseType(endpoint);

        expect(result).toBe("void");
      });

      it("should return void for 204 with no content", () => {
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

        const result = getResponseType(endpoint);

        expect(result).toBe("void");
      });

      it("should return ref type name", () => {
        const endpoint: IREndpoint = {
          path: "/users",
          method: "get",
          operationId: "getUsers",
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
                  schema: { kind: "ref", name: "User" },
                },
              ],
            },
          ],
        };

        const result = getResponseType(endpoint);

        expect(result).toBe("User");
      });

      it("should return array type", () => {
        const endpoint: IREndpoint = {
          path: "/users",
          method: "get",
          operationId: "getUsers",
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

        const result = getResponseType(endpoint);

        expect(result).toBe("Array<User>");
      });
    });
  });
}
