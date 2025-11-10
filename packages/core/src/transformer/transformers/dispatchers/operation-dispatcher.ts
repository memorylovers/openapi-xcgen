/**
 * Operation Dispatcher - v2 Transformer Architecture
 *
 * OperationObjectを処理し、operation-traverserとoperation-transformerを統合します。
 */

import type {
  IRHttpMethod,
  OperationObject,
  ParameterObject,
  PathItemObject,
} from "../../../types";
import type { VisitorContext } from "../../types";
import type { OperationTransformResult } from "../transformers/operation-transformer";
import { transformOperation } from "../transformers/operation-transformer";
import { traverseOperation } from "../traversers/operation-traverser";
import { dispatchSchema } from "./schema-dispatcher";

/**
 * OperationObjectを処理してIREndpointとモデルを生成
 *
 * @param operation - OperationObject
 * @param pathTemplate - パステンプレート（例: "/users/{id}"）
 * @param method - HTTPメソッド
 * @param context - Visitorコンテキスト
 * @param pathItemParameters - PathItemレベルのパラメータ（オプション）
 * @param pathItem - PathItemObject（security/extensions取得用、オプション）
 * @returns OperationTransformResult
 *
 * @example OpenAPI YAML
 * ```yaml
 * paths:
 *   /users/{id}:
 *     get:
 *       summary: Get user by ID
 *       operationId: getUserById
 *       parameters:
 *         - name: id
 *           in: path
 *           required: true
 *           schema:
 *             type: string
 *       responses:
 *         '200':
 *           description: Success
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/User'
 * ```
 */
export function dispatchOperation(
  operation: OperationObject,
  pathTemplate: string,
  method: IRHttpMethod,
  context: VisitorContext,
  pathItemParameters?: ParameterObject[],
  pathItem?: PathItemObject,
): OperationTransformResult {
  // 1. operation-traverserでOperation配下の要素を訪問
  const traversalResult = traverseOperation(
    operation,
    context,
    dispatchSchema, // schema処理はschema-dispatcherに委譲
    pathItemParameters,
  );

  // 2. operation-transformerでIREndpointを生成
  return transformOperation(
    operation,
    pathTemplate,
    method,
    context,
    pathItemParameters,
    traversalResult,
    pathItem,
  );
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("dispatchOperation", () => {
    it("should process minimal operation", () => {
      const operation: OperationObject = {
        summary: "Test operation",
        responses: {
          "200": {
            description: "Success",
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/test", "get"],
        rootSegment: "paths",
      };

      const result = dispatchOperation(operation, "/test", "get", context);

      expect(result.endpoint).not.toBeNull();
      expect(result.endpoint?.path).toBe("/test");
      expect(result.endpoint?.method).toBe("get");
      expect(result.endpoint?.summary).toBe("Test operation");
      expect(result.components).toEqual([]);
    });

    it("should process operation with path parameter", () => {
      const operation: OperationObject = {
        operationId: "getUserById",
        summary: "Get user by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths",
      };

      const result = dispatchOperation(
        operation,
        "/users/{id}",
        "get",
        context,
      );

      expect(result.endpoint).not.toBeNull();
      expect(result.endpoint?.operationId).toBe("getUserById");
      // Parameter model should be generated (GetUsersIdParams)
      expect(result.components).toHaveLength(1);
      expect(result.components[0].kind).toBe("parameter");
    });

    it("should merge pathItem and operation level parameters", () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "Success",
          },
        },
      };

      const pathItemParameters: ParameterObject[] = [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ];

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths",
      };

      const result = dispatchOperation(
        operation,
        "/users/{id}",
        "get",
        context,
        pathItemParameters,
      );

      expect(result.endpoint).not.toBeNull();
      // Unified parameter model should be generated (GetUsersIdParams)
      expect(result.components).toHaveLength(1);
      expect(result.components[0].kind).toBe("parameter");
    });

    it("should process operation with requestBody", () => {
      const operation: OperationObject = {
        summary: "Create user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post"],
        rootSegment: "paths",
      };

      const result = dispatchOperation(operation, "/users", "post", context);

      expect(result.endpoint).not.toBeNull();
      expect(result.endpoint?.summary).toBe("Create user");
      // RequestBody models should be collected (inline object schema + child models)
      expect(result.components.length).toBeGreaterThan(0);
    });

    it("should process operation with response containing schema", () => {
      const operation: OperationObject = {
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
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{id}", "get"],
        rootSegment: "paths",
      };

      const result = dispatchOperation(
        operation,
        "/users/{id}",
        "get",
        context,
      );

      expect(result.endpoint).not.toBeNull();
      // Response models should be collected (inline object schema + child models)
      expect(result.components.length).toBeGreaterThan(0);
    });

    it("should collect all models from complex operation", () => {
      const operation: OperationObject = {
        operationId: "updateUser",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "tags",
            in: "query",
            schema: {
              type: "array",
              items: { type: "string" },
            },
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    result: { type: "string" },
                  },
                },
              },
            },
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{id}", "put"],
        rootSegment: "paths",
      };

      const result = dispatchOperation(
        operation,
        "/users/{id}",
        "put",
        context,
      );

      expect(result.endpoint).not.toBeNull();
      expect(result.endpoint?.operationId).toBe("updateUser");

      // Models should be collected from:
      // 1. Parameter model (GetUsersIdParams with tags array)
      // 2. requestBody object
      // 3. response object
      // 4. Child models from nested structures
      expect(result.components.length).toBeGreaterThan(0);
    });

    it("should handle deprecated operation", () => {
      const operation: OperationObject = {
        summary: "Old endpoint",
        deprecated: true,
        responses: {
          "200": {
            description: "Success",
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/legacy", "get"],
        rootSegment: "paths",
      };

      const result = dispatchOperation(operation, "/legacy", "get", context);

      expect(result.endpoint).not.toBeNull();
      expect(result.endpoint?.deprecated).toBe(true);
    });
  });
}
