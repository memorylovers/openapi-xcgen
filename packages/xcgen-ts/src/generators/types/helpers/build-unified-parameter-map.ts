/**
 * 統合パラメータ型マップ構築
 *
 * parametersとrequestBodyの両方を持つエンドポイントを検出し、
 * 統合型が必要なparameterモデルのマップを構築する
 */

import type { XcgenIR } from "@openapi-xcgen/core";
import { resolveModelName } from "../../../helpers/model-resolver";

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
 *     parameters: { kind: "ref", name: "#/paths/.../parameters" },
 *     requestBody: {
 *       kind: "content",
 *       content: [{ schema: { kind: "ref", name: "#/components/schemas/UserUpdate" } }]
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
      endpoint.requestBody?.kind === "content"
    ) {
      const parameterPath = endpoint.parameters.name;

      // requestBodyの型名を抽出
      for (const content of endpoint.requestBody.content) {
        if (
          typeof content.schema !== "string" &&
          content.schema.kind === "ref"
        ) {
          // ir.modelsから正しいモデル名を逆引き
          const requestBodyTypeName = resolveModelName(
            content.schema.name,
            ir.models,
          );
          unifiedParameterTypes.set(parameterPath, requestBodyTypeName);
          break; // 最初のスキーマのみ使用
        }
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
        models: [],
        tags: [],
        endpoints: [
          {
            path: "/users/{userId}",
            method: "patch",
            operationId: "updateUser",
            tags: [],
            parameters: {
              kind: "ref",
              name: "#/paths/~1users~1{userId}/patch/parameters",
            },
            requestBody: {
              kind: "content",
              description: "User update data",
              content: [
                {
                  mimeType: "application/json",
                  schema: {
                    kind: "ref",
                    name: "#/components/schemas/UserUpdate",
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
        models: [],
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
        models: [],
        tags: [],
        endpoints: [
          {
            path: "/users/{userId}",
            method: "patch",
            operationId: "updateUser",
            tags: [],
            parameters: {
              kind: "ref",
              name: "#/paths/~1users~1{userId}/patch/parameters",
            },
            requestBody: {
              kind: "content",
              content: [
                {
                  mimeType: "application/json",
                  schema: {
                    kind: "ref",
                    name: "#/components/schemas/UserUpdate",
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
              name: "#/paths/~1products~1{productId}/put/parameters",
            },
            requestBody: {
              kind: "content",
              content: [
                {
                  mimeType: "application/json",
                  schema: {
                    kind: "ref",
                    name: "#/components/schemas/ProductUpdate",
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
        models: [],
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
                    name: "#/components/schemas/UserCreate",
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

    it("should resolve requestBody type from ir.models for inline schemas (paths)", () => {
      const ir: XcgenIR = {
        metadata: { title: "Test API", version: "1.0.0" },
        models: [
          {
            kind: "union",
            name: "PostBookingsBookingIdPaymentRequestBody",
            referencePath:
              "#/paths/::bookings::{bookingId}::payment/post/requestBody/content/application::json/schema",
            types: [
              { kind: "ref", name: "#/components/schemas/CardPayment" },
              { kind: "ref", name: "#/components/schemas/BankTransferPayment" },
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
              name: "#/paths/~1bookings~1{bookingId}~1payment/post/parameters",
            },
            requestBody: {
              kind: "content",
              required: true,
              content: [
                {
                  mimeType: "application/json",
                  schema: {
                    kind: "ref",
                    name: "#/paths/::bookings::{bookingId}::payment/post/requestBody/content/application::json/schema",
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
  });
}
