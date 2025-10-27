/**
 * endpoint:generate Hook の統合テスト
 *
 * generateEndpoint() と Hook 機構の統合動作を検証
 */

import type { IREndpoint } from "@openapi-xcgen/core";
import { describe, expect, it } from "vitest";
import { generateEndpoint } from "../../../src/generators/services/services-endpoint";
import { createHooks } from "../../../src/hooks";

describe("endpoint:generate hook", () => {
  describe("Custom function name transformation (x-function-name)", () => {
    it.each([
      {
        description:
          "should transform function name using x-function-name extension",
        endpoint: {
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
                    name: "#/paths/::users/get/responses/200/GetUsers200Response",
                  },
                },
              ],
            },
          ],
          extensions: { "x-function-name": "listAllUsers" },
        } satisfies IREndpoint,
        expected: `/**
 * Get all users
 * @param init - Additional fetch options
 * @returns GetUsers200Response
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function listAllUsers(
  init?: RequestInit,
): Promise<GetUsers200Response> {
  return request({
    method: "GET",
    path: "/users",
    options: {},
    init,
  });
}`,
      },
      {
        description: "should not transform when x-function-name is not present",
        endpoint: {
          path: "/pets",
          method: "get",
          operationId: "getPets",
          summary: "Get all pets",
          tags: [],
          parameters: [],
          responses: [],
        } satisfies IREndpoint,
        expected: `/**
 * Get all pets
 * @param init - Additional fetch options
 * @returns void
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function getPets(
  init?: RequestInit,
): Promise<void> {
  return request({
    method: "GET",
    path: "/pets",
    options: {},
    init,
  });
}`,
      },
    ])("$description", ({ endpoint, expected }) => {
      const hooks = createHooks({
        "endpoint:generate": (ctx) => {
          if (ctx.extensions?.["x-function-name"]) {
            ctx.tsCode.functionName = ctx.extensions[
              "x-function-name"
            ] as string;
          }
        },
      });

      const result = generateEndpoint(endpoint, hooks);

      expect(result).toEqual(expected);
    });
  });

  describe("Code modification", () => {
    it("should allow hook to modify generated code", () => {
      const hooks = createHooks({
        "endpoint:generate": (ctx) => {
          // コードの末尾にカスタムロギングを追加
          ctx.tsCode.code = ctx.tsCode.code.replace(
            /return request\({/,
            "// Custom logging\n  console.log('API call:', '" +
              ctx.endpoint.path +
              "');\n  return request({",
          );
        },
      });

      const endpoint: IREndpoint = {
        path: "/users",
        method: "get",
        operationId: "getUsers",
        tags: [],
        parameters: [],
        responses: [],
      };

      const result = generateEndpoint(endpoint, hooks);

      expect(result).toEqual(`/**
 * @param init - Additional fetch options
 * @returns void
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function getUsers(
  init?: RequestInit,
): Promise<void> {
  // Custom logging
  console.log('API call:', '/users');
  return request({
    method: "GET",
    path: "/users",
    options: {},
    init,
  });
}`);
    });

    it("should allow hook to replace entire code", () => {
      const hooks = createHooks({
        "endpoint:generate": (ctx) => {
          ctx.tsCode.code = `export const ${ctx.tsCode.functionName} = () => { return 'mocked'; };`;
        },
      });

      const endpoint: IREndpoint = {
        path: "/test",
        method: "get",
        operationId: "getTest",
        tags: [],
        parameters: [],
        responses: [],
      };

      const result = generateEndpoint(endpoint, hooks);

      expect(result).toEqual(
        `export const getTest = () => { return 'mocked'; };`,
      );
    });
  });

  describe("Multiple hooks execution", () => {
    it("should execute multiple hooks in order", () => {
      const calls: string[] = [];

      const hooks = createHooks({
        "endpoint:generate": [
          (ctx) => {
            calls.push("hook1");
            ctx.tsCode.functionName = "modified1";
          },
          (ctx) => {
            calls.push("hook2");
            ctx.tsCode.functionName = `${ctx.tsCode.functionName}AndMore`;
          },
        ],
      });

      const endpoint: IREndpoint = {
        path: "/users",
        method: "get",
        operationId: "getUsers",
        tags: [],
        parameters: [],
        responses: [],
      };

      const result = generateEndpoint(endpoint, hooks);

      expect(calls).toEqual(["hook1", "hook2"]);
      expect(result).toEqual(`/**
 * @param init - Additional fetch options
 * @returns void
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function modified1AndMore(
  init?: RequestInit,
): Promise<void> {
  return request({
    method: "GET",
    path: "/users",
    options: {},
    init,
  });
}`);
    });

    it("should allow hooks to cooperate", () => {
      const hooks = createHooks({
        "endpoint:generate": [
          (ctx) => {
            // Hook1: x-function-name を適用
            if (ctx.extensions?.["x-function-name"]) {
              ctx.tsCode.functionName = ctx.extensions[
                "x-function-name"
              ] as string;
            }
          },
          (ctx) => {
            // Hook2: 特定の関数にログ追加
            if (ctx.tsCode.functionName === "listUsers") {
              ctx.tsCode.code = ctx.tsCode.code.replace(
                /return request\({/,
                "console.log('Calling listUsers');\n  return request({",
              );
            }
          },
        ],
      });

      const endpoint: IREndpoint = {
        path: "/users",
        method: "get",
        operationId: "getUsers",
        tags: [],
        parameters: [],
        responses: [],
        extensions: { "x-function-name": "listUsers" },
      };

      const result = generateEndpoint(endpoint, hooks);

      expect(result).toEqual(`/**
 * @param init - Additional fetch options
 * @returns void
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function listUsers(
  init?: RequestInit,
): Promise<void> {
  console.log('Calling listUsers');
  return request({
    method: "GET",
    path: "/users",
    options: {},
    init,
  });
}`);
    });
  });

  describe("No hooks registered", () => {
    it("should work without hooks", () => {
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
                  name: "#/paths/::users/get/responses/200/GetUsers200Response",
                },
              },
            ],
          },
        ],
      };

      // hooks なしで呼び出し
      const result = generateEndpoint(endpoint);

      expect(result).toEqual(`/**
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
}`);
    });
  });

  describe("Different HTTP methods", () => {
    it("should work with POST endpoint", () => {
      const hooks = createHooks({
        "endpoint:generate": (ctx) => {
          if (ctx.extensions?.["x-function-name"]) {
            ctx.tsCode.functionName = ctx.extensions[
              "x-function-name"
            ] as string;
          }
        },
      });

      const endpoint: IREndpoint = {
        path: "/users",
        method: "post",
        operationId: "createUser",
        summary: "Create a user",
        tags: [],
        parameters: [],
        responses: [],
        extensions: { "x-function-name": "addUser" },
      };

      const result = generateEndpoint(endpoint, hooks);

      expect(result).toContain("export async function addUser");
      expect(result).toContain('method: "POST"');
    });

    it("should work with DELETE endpoint", () => {
      const endpoint: IREndpoint = {
        path: "/users/{userId}",
        method: "delete",
        operationId: "deleteUser",
        tags: [],
        parameters: [],
        responses: [],
      };

      const result = generateEndpoint(endpoint);

      expect(result).toContain("export async function deleteUser");
      expect(result).toContain('method: "DELETE"');
    });
  });

  describe("Endpoints with parameters", () => {
    it("should handle endpoint with custom function name", () => {
      const hooks = createHooks({
        "endpoint:generate": (ctx) => {
          if (ctx.extensions?.["x-function-name"]) {
            ctx.tsCode.functionName = ctx.extensions[
              "x-function-name"
            ] as string;
          }
        },
      });

      const endpoint: IREndpoint = {
        path: "/users/{userId}",
        method: "get",
        operationId: "getUserById",
        tags: [],
        parameters: [],
        responses: [],
        extensions: { "x-function-name": "fetchUserById" },
      };

      const result = generateEndpoint(endpoint, hooks);

      expect(result).toContain("export async function fetchUserById");
      expect(result).toContain('path: "/users/{userId}"');
    });
  });

  describe("Complex scenarios", () => {
    it("should handle endpoint with description and summary", () => {
      const hooks = createHooks({
        "endpoint:generate": (ctx) => {
          if (ctx.extensions?.["x-function-name"]) {
            ctx.tsCode.functionName = ctx.extensions[
              "x-function-name"
            ] as string;
          }
        },
      });

      const endpoint: IREndpoint = {
        path: "/users",
        method: "get",
        operationId: "getUsers",
        summary: "Get all users",
        description: "Retrieve a list of all users in the system",
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
                  name: "#/paths/::users/get/responses/200/GetUsers200Response",
                },
              },
            ],
          },
        ],
        extensions: { "x-function-name": "listAllUsers" },
      };

      const result = generateEndpoint(endpoint, hooks);

      expect(result).toEqual(`/**
 * Get all users
 * Retrieve a list of all users in the system
 * @param init - Additional fetch options
 * @returns GetUsers200Response
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function listAllUsers(
  init?: RequestInit,
): Promise<GetUsers200Response> {
  return request({
    method: "GET",
    path: "/users",
    options: {},
    init,
  });
}`);
    });

    it("should handle deprecated endpoint", () => {
      const endpoint: IREndpoint = {
        path: "/legacy/users",
        method: "get",
        operationId: "getLegacyUsers",
        deprecated: true,
        tags: [],
        parameters: [],
        responses: [],
      };

      const result = generateEndpoint(endpoint);

      expect(result).toContain("@deprecated");
      expect(result).toContain("export async function getLegacyUsers");
    });
  });
});
