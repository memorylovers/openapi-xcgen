/**
 * operation-visitor.ts - OperationObjectを処理してIREndpointに変換
 *
 * OpenAPIのOperationObject（個別のAPI操作）を処理し、
 * IREndpointに変換する。
 *
 * 責務:
 * - operationId、summary、description、tags、deprecatedの処理
 * - parameters配列の処理（visitParameterに委譲）
 * - requestBodyの処理（visitRequestBodyに委譲）
 * - responsesの処理（visitResponseに委譲）
 */

import { consola } from "consola";
import type { OperationObject, ReferenceObject } from "../../types/index.js";
import type {
  IREndpoint,
  IRHttpMethod,
  IRParameter,
  IRResponse,
} from "../../types/ir/index.js";
import type { VisitorContext } from "../types.js";
import { isReferenceObject } from "../../types/guards.js";
import { visitParameter } from "./parameter-visitor.js";
import { visitRequestBody } from "./request-body-visitor.js";
import { visitResponse } from "./response-visitor.js";

/**
 * Operation処理用の拡張コンテキスト
 */
export interface OperationContext extends VisitorContext {
  /** HTTPメソッド（get/post/put等） */
  method: string;
  /** パステンプレート（例: "/pets/{id}"） */
  pathTemplate: string;
}

/**
 * OperationObjectを処理してIREndpointに変換
 *
 * @param operation - OpenAPIのOperationObject
 * @param context - Operation用のコンテキスト
 * @returns IREndpoint、またはnull（operationIdがない場合）
 *
 * @example OpenAPI YAML
 * ```yaml
 * get:
 *   operationId: getPet
 *   summary: Get a pet by ID
 *   description: Returns a single pet
 *   tags: [pets]
 *   deprecated: false
 *   parameters:
 *     - name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *   responses:
 *     '200':
 *       description: Success
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pet'
 * ```
 */
export function visitOperation(
  operation: OperationObject,
  context: OperationContext,
): IREndpoint | null {
  // operationIdは必須
  if (!operation.operationId) {
    consola.warn(
      `Operation without operationId at ${context.method.toUpperCase()} ${
        context.pathTemplate
      }`,
    );
    return null;
  }

  // parameters処理
  const parameters: IRParameter[] = [];
  if (operation.parameters) {
    for (const param of operation.parameters) {
      if (isReferenceObject(param)) {
        consola.warn(
          `Reference parameter not supported yet in operation: ${operation.operationId}`,
        );
        continue;
      }
      const irParam = visitParameter(param, context);
      if (irParam) {
        parameters.push(irParam);
      }
    }
  }

  // requestBody処理
  let requestBody;
  if (operation.requestBody) {
    const irRequestBody = visitRequestBody(
      operation.requestBody,
      operation.operationId,
      context,
    );
    if (irRequestBody) {
      requestBody = irRequestBody;
    }
  }

  // responses処理
  const responses: IRResponse[] = [];
  if (operation.responses) {
    for (const [statusCode, response] of Object.entries(operation.responses)) {
      const irResponse = visitResponse(response, statusCode, context);
      if (irResponse) {
        responses.push(irResponse);
      }
    }
  }

  const endpoint: IREndpoint = {
    id: operation.operationId,
    method: context.method as IRHttpMethod,
    path: context.pathTemplate,
    summary: operation.summary,
    description: operation.description,
    parameters,
    requestBody,
    responses,
    deprecated: operation.deprecated,
  };

  return endpoint;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;
  const { createContext } = await import("../types.js");

  describe("visitOperation", () => {
    it("should extract basic operation info", () => {
      const operation: OperationObject = {
        operationId: "getPet",
        summary: "Get a pet by ID",
        description: "Returns a single pet",
        tags: ["pets"],
        responses: {
          "200": { description: "Success" },
        },
      };

      const context: OperationContext = {
        ...createContext(),
        method: "get",
        pathTemplate: "/pets/{id}",
      };

      const result = visitOperation(operation, context);

      // Red Phase: このテストは失敗する
      expect(result).not.toBeNull();
      expect(result).toEqual(
        expect.objectContaining({
          id: "getPet",
          method: "get",
          path: "/pets/{id}",
          summary: "Get a pet by ID",
          description: "Returns a single pet",
          parameters: [],
          responses: expect.any(Array),
        }),
      );
    });

    it("should handle deprecated operations", () => {
      const operation: OperationObject = {
        operationId: "oldEndpoint",
        deprecated: true,
        responses: {},
      };

      const context: OperationContext = {
        ...createContext(),
        method: "post",
        pathTemplate: "/old/endpoint",
      };

      const result = visitOperation(operation, context);

      // Red Phase: このテストは失敗する
      expect(result).not.toBeNull();
      expect(result?.deprecated).toBe(true);
    });

    it("should return null for operations without operationId", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const operation: OperationObject = {
        // operationIdなし
        summary: "Missing ID",
        responses: {},
      };

      const context: OperationContext = {
        ...createContext(),
        method: "get",
        pathTemplate: "/missing",
      };

      const result = visitOperation(operation, context);

      // このテストは成功する（最小実装がnullを返すため）
      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        "Operation without operationId at GET /missing",
      );

      warnSpy.mockRestore();
    });

    it("should handle operations without tags", () => {
      const operation: OperationObject = {
        operationId: "noTags",
        // tagsなし
        responses: {},
      };

      const context: OperationContext = {
        ...createContext(),
        method: "get",
        pathTemplate: "/no-tags",
      };

      const result = visitOperation(operation, context);

      // Red Phase: このテストは失敗する
      expect(result).not.toBeNull();
      expect(result?.id).toBe("noTags");
      // tagsは含まれないかundefined
    });

    it("should process parameters array", () => {
      const operation: OperationObject = {
        operationId: "withParams",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {},
      };

      const context: OperationContext = {
        ...createContext(),
        method: "get",
        pathTemplate: "/with/{id}",
      };

      const result = visitOperation(operation, context);

      expect(result).not.toBeNull();
      expect(result?.parameters).toHaveLength(2);
      expect(result?.parameters[0]).toEqual({
        name: "id",
        in: "path",
        required: true,
        description: undefined,
        type: { kind: "primitive", type: "string" },
        defaultValue: undefined,
        deprecated: undefined,
      });
      expect(result?.parameters[1]).toEqual({
        name: "limit",
        in: "query",
        required: false,
        description: undefined,
        type: { kind: "primitive", type: "integer" },
        defaultValue: 10,
        deprecated: undefined,
      });
    });

    it("should process requestBody", () => {
      const operation: OperationObject = {
        operationId: "createPet",
        requestBody: {
          description: "Pet to add",
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  age: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {},
      };

      const context: OperationContext = {
        ...createContext(),
        method: "post",
        pathTemplate: "/pets",
      };

      const result = visitOperation(operation, context);

      expect(result).not.toBeNull();
      expect(result?.requestBody).toBeDefined();
      expect(result?.requestBody?.description).toBe("Pet to add");
      expect(result?.requestBody?.required).toBe(true);
      expect(result?.requestBody?.content).toBeDefined();
      expect(result?.requestBody?.content?.["application/json"]).toBeDefined();
    });

    it("should process responses with content", () => {
      const operation: OperationObject = {
        operationId: "getPet",
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Not found",
          },
        },
      };

      const context: OperationContext = {
        ...createContext(),
        method: "get",
        pathTemplate: "/pets/{id}",
      };

      const result = visitOperation(operation, context);

      expect(result).not.toBeNull();
      expect(result?.responses).toHaveLength(2);

      const response200 = result?.responses.find((r) => r.statusCode === "200");
      expect(response200).toBeDefined();
      expect(response200?.description).toBe("Success");
      expect(response200?.content?.["application/json"]).toBeDefined();

      const response404 = result?.responses.find((r) => r.statusCode === "404");
      expect(response404).toBeDefined();
      expect(response404?.description).toBe("Not found");
      expect(response404?.content).toBeUndefined();
    });

    it("should warn and skip reference parameters", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const operation: OperationObject = {
        operationId: "withRefParam",
        parameters: [
          {
            $ref: "#/components/parameters/IdParam",
          } as ReferenceObject,
          {
            name: "limit",
            in: "query",
            schema: { type: "integer" },
          },
        ],
        responses: {},
      };

      const context: OperationContext = {
        ...createContext(),
        method: "get",
        pathTemplate: "/ref/{id}",
      };

      const result = visitOperation(operation, context);

      expect(result).not.toBeNull();
      expect(result?.parameters).toHaveLength(1); // 参照は飛ばされる
      expect(result?.parameters[0].name).toBe("limit");
      expect(warnSpy).toHaveBeenCalledWith(
        "Reference parameter not supported yet in operation: withRefParam",
      );

      warnSpy.mockRestore();
    });
  });
}
