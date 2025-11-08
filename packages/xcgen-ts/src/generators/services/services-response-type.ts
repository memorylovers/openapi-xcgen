/**
 * レスポンス型取得
 */

import type { IREndpoint, IRComponent } from "@openapi-xcgen/core";
import { irTypeToTsType } from "../../helpers/type-mapper";
import { resolveModelName } from "../../helpers/model-resolver";

/**
 * エンドポイントからレスポンス型を取得
 * @param endpoint - IRエンドポイント
 * @param models - IRコンポーネントリスト（型名解決用）
 * @returns TypeScript型文字列
 */
export function getResponseType(
  endpoint: IREndpoint,
  models: readonly IRComponent[],
): string {
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
    // IRコンポーネントリストから正しいモデル名を逆引き
    return resolveModelName(successResponse.ref.referencePath, models);
  }

  if (!successResponse.content || successResponse.content.length === 0) {
    return "void";
  }

  // application/jsonのcontentを優先
  const jsonContent = successResponse.content.find((c) =>
    c.mimeType.includes("json"),
  );

  const content = jsonContent || successResponse.content[0];

  // IRRefの場合、モデルリストから正しいモデル名を逆引き
  if (typeof content.schema !== "string" && content.schema.kind === "ref") {
    return resolveModelName(content.schema.referencePath, models);
  }

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

        const result = getResponseType(endpoint, []);

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

        const result = getResponseType(endpoint, []);

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
                  schema: {
                    kind: "ref",
                    referencePath: "#/components/schemas/User",
                  },
                },
              ],
            },
          ],
        };

        const result = getResponseType(endpoint, []);

        expect(result).toBe("User");
      });

      it("should return type name for array model ref", () => {
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

        const result = getResponseType(endpoint, models);

        // IRRef to IRArraySchema returns the model name (not "Array<T>")
        // Array formatting should be done at a higher level that has access to models
        expect(result).toBe("GetUsers200Response");
      });
    });
  });
}
