/**
 * 統合パラメータ型マップ構築
 *
 * parametersとrequestBodyの両方を持つエンドポイントを検出し、
 * 統合型が必要なparameterモデルのマップを構築する
 */

import type { XcgenIR } from "@openapi-xcgen/core";
import { resolveModelName } from "../../../helpers/model-resolver";
import { irTypeToTsType } from "../../../helpers/type-mapper";

/**
 * 統合パラメータ型のマップを構築
 *
 * @param ir - XcgenIR
 * @returns Map<parameterReferencePath, requestBodyTypeName>
 *
 * @example
 * ```typescript
 * const ir: XcgenIR = {
 *   endpoints: [{
 *     parameters: { kind: "ref", referencePath: "#/paths/.../parameters" },
 *     requestBody: {
 *       kind: "content",
 *       content: [{ schema: { kind: "ref", referencePath: "#/components/schemas/UserUpdate" } }]
 *     }
 *   }]
 * };
 * buildUnifiedParameterTypesMap(ir);
 * // => Map { "#/paths/.../parameters" => "UserUpdate" }
 * ```
 */
export function buildUnifiedParameterTypesMap(
  ir: XcgenIR,
): Map<string, string> {
  const unifiedParameterTypes = new Map<string, string>();

  for (const endpoint of ir.endpoints) {
    // parametersとrequestBodyの両方がある場合
    if (
      !Array.isArray(endpoint.parameters) &&
      typeof endpoint.parameters !== "string" &&
      endpoint.parameters?.kind === "ref" &&
      endpoint.requestBody &&
      (endpoint.requestBody.kind === "content" ||
        endpoint.requestBody.kind === "ref")
    ) {
      const parameterPath = endpoint.parameters.referencePath;

      let requestBodyTypeName: string | undefined;

      if (endpoint.requestBody.kind === "content") {
        // requestBodyの型名を抽出（contentの場合）
        // Phase 1: Prioritize $ref (structured models)
        for (const content of endpoint.requestBody.content) {
          if (
            typeof content.schema !== "string" &&
            content.schema.kind === "ref"
          ) {
            // ir.componentsから正しいモデル名を逆引き
            requestBodyTypeName = resolveModelName(
              content.schema.referencePath,
              ir.components,
            );
            break;
          }
        }

        // Phase 2: Fallback to scalar types if no $ref found
        if (!requestBodyTypeName) {
          for (const content of endpoint.requestBody.content) {
            if (typeof content.schema === "string") {
              // スカラー型の場合、TypeScript型名を使用
              requestBodyTypeName = irTypeToTsType(content.schema);
              break;
            }
          }
        }
      } else if (endpoint.requestBody.kind === "ref") {
        // requestBodyの型名を抽出（refの場合）
        requestBodyTypeName = resolveModelName(
          endpoint.requestBody.ref.referencePath,
          ir.components,
        );
      }

      if (requestBodyTypeName) {
        unifiedParameterTypes.set(parameterPath, requestBodyTypeName);
      }
    }
  }

  return unifiedParameterTypes;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("buildUnifiedParameterTypesMap", () => {
    it("should build map for endpoints with parameters and requestBody", () => {
      const ir: XcgenIR = {
        metadata: { title: "Test API", version: "1.0.0" },
        components: [],
        tags: [],
        endpoints: [
          {
            path: "/users/{userId}",
            method: "patch",
            operationId: "updateUser",
            tags: [],
            parameters: {
              kind: "ref",
              referencePath: "#/paths/~1users~1{userId}/patch/parameters",
            },
            requestBody: {
              kind: "content",
              description: "User update data",
              content: [
                {
                  mimeType: "application/json",
                  schema: {
                    kind: "ref",
                    referencePath: "#/components/schemas/UserUpdate",
                  },
                },
              ],
            },
            responses: [],
          },
        ],
      };

      const result = buildUnifiedParameterTypesMap(ir);

      expect(result.size).toBe(1);
      expect(result.get("#/paths/~1users~1{userId}/patch/parameters")).toBe(
        "UserUpdate",
      );
    });

    it("should return empty map when no endpoints have both parameters and requestBody", () => {
      const ir: XcgenIR = {
        metadata: { title: "Test API", version: "1.0.0" },
        components: [],
        tags: [],
        endpoints: [
          {
            path: "/users",
            method: "get",
            operationId: "getUsers",
            tags: [],
            parameters: [],
            responses: [],
          },
        ],
      };

      const result = buildUnifiedParameterTypesMap(ir);

      expect(result.size).toBe(0);
    });

    it("should handle multiple endpoints with unified parameters", () => {
      const ir: XcgenIR = {
        metadata: { title: "Test API", version: "1.0.0" },
        components: [],
        tags: [],
        endpoints: [
          {
            path: "/users/{userId}",
            method: "patch",
            operationId: "updateUser",
            tags: [],
            parameters: {
              kind: "ref",
              referencePath: "#/paths/~1users~1{userId}/patch/parameters",
            },
            requestBody: {
              kind: "content",
              content: [
                {
                  mimeType: "application/json",
                  schema: {
                    kind: "ref",
                    referencePath: "#/components/schemas/UserUpdate",
                  },
                },
              ],
            },
            responses: [],
          },
          {
            path: "/products/{productId}",
            method: "put",
            operationId: "updateProduct",
            tags: [],
            parameters: {
              kind: "ref",
              referencePath: "#/paths/~1products~1{productId}/put/parameters",
            },
            requestBody: {
              kind: "content",
              content: [
                {
                  mimeType: "application/json",
                  schema: {
                    kind: "ref",
                    referencePath: "#/components/schemas/ProductUpdate",
                  },
                },
              ],
            },
            responses: [],
          },
        ],
      };

      const result = buildUnifiedParameterTypesMap(ir);

      expect(result.size).toBe(2);
      expect(result.get("#/paths/~1users~1{userId}/patch/parameters")).toBe(
        "UserUpdate",
      );
      expect(result.get("#/paths/~1products~1{productId}/put/parameters")).toBe(
        "ProductUpdate",
      );
    });

    it("should skip endpoints with array parameters", () => {
      const ir: XcgenIR = {
        metadata: { title: "Test API", version: "1.0.0" },
        components: [],
        tags: [],
        endpoints: [
          {
            path: "/users",
            method: "post",
            operationId: "createUser",
            tags: [],
            parameters: [
              {
                name: "X-Api-Key",
                in: "header",
                type: "string",
                required: true,
              },
            ],
            requestBody: {
              kind: "content",
              content: [
                {
                  mimeType: "application/json",
                  schema: {
                    kind: "ref",
                    referencePath: "#/components/schemas/UserCreate",
                  },
                },
              ],
            },
            responses: [],
          },
        ],
      };

      const result = buildUnifiedParameterTypesMap(ir);

      expect(result.size).toBe(0);
    });

    it("should resolve requestBody type from ir.components for inline schemas (paths)", () => {
      const ir: XcgenIR = {
        metadata: { title: "Test API", version: "1.0.0" },
        components: [
          {
            kind: "union",
            name: "PostBookingsBookingIdPaymentRequestBody",
            referencePath:
              "#/paths/::bookings::{bookingId}::payment/post/requestBody/content/application::json/schema",
            types: [
              {
                kind: "ref",
                referencePath: "#/components/schemas/CardPayment",
              },
              {
                kind: "ref",
                referencePath: "#/components/schemas/BankTransferPayment",
              },
            ],
          },
        ],
        tags: [],
        endpoints: [
          {
            path: "/bookings/{bookingId}/payment",
            method: "post",
            operationId: "payForBooking",
            tags: [],
            parameters: {
              kind: "ref",
              referencePath:
                "#/paths/~1bookings~1{bookingId}~1payment/post/parameters",
            },
            requestBody: {
              kind: "content",
              required: true,
              content: [
                {
                  mimeType: "application/json",
                  schema: {
                    kind: "ref",
                    referencePath:
                      "#/paths/::bookings::{bookingId}::payment/post/requestBody/content/application::json/schema",
                  },
                },
              ],
            },
            responses: [],
          },
        ],
      };

      const result = buildUnifiedParameterTypesMap(ir);

      expect(result.size).toBe(1);
      expect(
        result.get("#/paths/~1bookings~1{bookingId}~1payment/post/parameters"),
      ).toBe("PostBookingsBookingIdPaymentRequestBody");
    });

    it("should handle requestBody with kind: ref (component reference)", () => {
      const ir: XcgenIR = {
        metadata: { title: "Test API", version: "1.0.0" },
        components: [
          {
            kind: "object",
            name: "UserArray",
            referencePath: "#/components/requestBodies/UserArray",
            properties: [],
          },
        ],
        tags: [],
        endpoints: [
          {
            path: "/users/{userId}",
            method: "patch",
            operationId: "updateUser",
            tags: [],
            parameters: {
              kind: "ref",
              referencePath: "#/paths/~1users~1{userId}/patch/parameters",
            },
            requestBody: {
              kind: "ref",
              ref: {
                kind: "ref",
                referencePath: "#/components/requestBodies/UserArray",
              },
            },
            responses: [],
          },
        ],
      };

      const result = buildUnifiedParameterTypesMap(ir);

      expect(result.size).toBe(1);
      expect(result.get("#/paths/~1users~1{userId}/patch/parameters")).toBe(
        "UserArray",
      );
    });

    it("should handle requestBody with scalar type (string)", () => {
      const ir: XcgenIR = {
        metadata: { title: "Test API", version: "1.0.0" },
        components: [],
        tags: [],
        endpoints: [
          {
            path: "/files/{fileId}",
            method: "put",
            operationId: "updateFileContent",
            tags: [],
            parameters: {
              kind: "ref",
              referencePath: "#/paths/~1files~1{fileId}/put/parameters",
            },
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
          },
        ],
      };

      const result = buildUnifiedParameterTypesMap(ir);

      expect(result.size).toBe(1);
      expect(result.get("#/paths/~1files~1{fileId}/put/parameters")).toBe(
        "string",
      );
    });

    it("should handle requestBody with scalar type (binary)", () => {
      const ir: XcgenIR = {
        metadata: { title: "Test API", version: "1.0.0" },
        components: [],
        tags: [],
        endpoints: [
          {
            path: "/upload/{id}",
            method: "post",
            operationId: "uploadWithMetadata",
            tags: [],
            parameters: {
              kind: "ref",
              referencePath: "#/paths/~1upload~1{id}/post/parameters",
            },
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
          },
        ],
      };

      const result = buildUnifiedParameterTypesMap(ir);

      expect(result.size).toBe(1);
      expect(result.get("#/paths/~1upload~1{id}/post/parameters")).toBe("Blob");
    });

    it("should prioritize $ref over scalar when both exist in content", () => {
      const ir: XcgenIR = {
        metadata: { title: "Test API", version: "1.0.0" },
        components: [],
        tags: [],
        endpoints: [
          {
            path: "/users/{userId}",
            method: "patch",
            operationId: "updateUser",
            tags: [],
            parameters: {
              kind: "ref",
              referencePath: "#/paths/~1users~1{userId}/patch/parameters",
            },
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
          },
        ],
      };

      const result = buildUnifiedParameterTypesMap(ir);

      expect(result.size).toBe(1);
      // $refが優先されるべき
      expect(result.get("#/paths/~1users~1{userId}/patch/parameters")).toBe(
        "UserUpdate",
      );
    });
  });
}
