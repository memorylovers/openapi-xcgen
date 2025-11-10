/**
 * parameter:generate Hook の統合テスト
 *
 * generateParameterProperty() と Hook 機構の統合動作を検証
 */

import type {
  IREndpoint,
  IRParameterProperty,
  XcgenIR,
} from "@openapi-xcgen/core";
import { describe, expect, it } from "vitest";
import type { TypeGenerationContext } from "../../../src/generators/types/generation-context";
import { generateParameterProperty } from "../../../src/generators/types/types-parameter-property";
import { createHooks } from "../../../src/hooks";

describe("parameter:generate hook", () => {
  const mockIR: XcgenIR = {
    metadata: { title: "Test API", version: "1.0.0" },
    components: [],
    tags: [],
    endpoints: [],
  };

  const mockEndpoint: IREndpoint = {
    path: "/users/{id}",
    method: "get",
    operationId: "getUser",
    summary: "Get user by ID",
    description: "Retrieve a user by their ID",
    tags: ["users"],
    parameters: [],
    responses: [],
  };

  describe("Custom type transformation (x-type)", () => {
    it.each([
      {
        description: "should transform string to UserId",
        parameter: {
          name: "id",
          type: "string",
          in: "path" as const,
          required: true,
          extensions: { "x-type": "UserId" },
        } satisfies IRParameterProperty,
        expected: "id: UserId;",
      },
      {
        description: "should not transform when x-type is not present",
        parameter: {
          name: "limit",
          type: "int",
          in: "query" as const,
        } satisfies IRParameterProperty,
        expected: "limit?: number | undefined;",
      },
      {
        description: "should transform string to EmailAddress",
        parameter: {
          name: "email",
          type: "string",
          in: "query" as const,
          required: true,
          extensions: { "x-type": "EmailAddress" },
        } satisfies IRParameterProperty,
        expected: "email: EmailAddress;",
      },
    ])("$description", ({ parameter, expected }) => {
      const hooks = createHooks({
        "parameter:generate": (ctx) => {
          if (ctx.extensions?.["x-type"]) {
            ctx.tsCode.typeName = ctx.extensions["x-type"] as string;
          }
        },
      });

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateParameterProperty(parameter, mockEndpoint, ctx);

      expect(result).toEqual(expected);
    });
  });

  describe("Parameter name customization", () => {
    it("should allow hook to customize parameter name", () => {
      const hooks = createHooks({
        "parameter:generate": (ctx) => {
          // ヘッダーパラメータを camelCase に変換
          if (ctx.parameter.in === "header") {
            ctx.tsCode.name = ctx.tsCode.name.replace(/-/g, "");
          }
        },
      });

      const parameter: IRParameterProperty = {
        name: "X-Api-Key",
        type: "string",
        in: "header",
        required: true,
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateParameterProperty(parameter, mockEndpoint, ctx);

      expect(result).toEqual("xApiKey: string;");
    });
  });

  describe("Multiple hooks execution", () => {
    it("should execute multiple hooks in order", () => {
      const calls: string[] = [];

      const hooks = createHooks({
        "parameter:generate": [
          (ctx) => {
            calls.push("hook1");
            ctx.tsCode.typeName = "Type1";
          },
          (ctx) => {
            calls.push("hook2");
            ctx.tsCode.typeName = `${ctx.tsCode.typeName} | Type2`;
          },
        ],
      });

      const parameter: IRParameterProperty = {
        name: "data",
        type: "string",
        in: "query",
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateParameterProperty(parameter, mockEndpoint, ctx);

      expect(calls).toEqual(["hook1", "hook2"]);
      expect(result).toEqual("data?: Type1 | Type2 | undefined;");
    });

    it("should allow hooks to cooperate", () => {
      const hooks = createHooks({
        "parameter:generate": [
          (ctx) => {
            // Hook1: x-type を適用
            if (ctx.extensions?.["x-type"]) {
              ctx.tsCode.typeName = ctx.extensions["x-type"] as string;
            }
          },
          (ctx) => {
            // Hook2: 特定の型に対してコメント追加
            if (ctx.tsCode.typeName === "UserId") {
              ctx.tsCode.comment = "Unique user identifier";
            }
          },
        ],
      });

      const parameter: IRParameterProperty = {
        name: "userId",
        type: "string",
        in: "path",
        required: true,
        extensions: { "x-type": "UserId" },
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateParameterProperty(parameter, mockEndpoint, ctx);

      expect(result).toEqual("/** Unique user identifier */ userId: UserId;");
    });
  });

  describe("Optional and nullable handling", () => {
    it("should respect optional flag modified by hook", () => {
      const hooks = createHooks({
        "parameter:generate": (ctx) => {
          // query パラメータを強制的に required に変更
          if (ctx.parameter.in === "query") {
            ctx.tsCode.optional = false;
          }
        },
      });

      const parameter: IRParameterProperty = {
        name: "filter",
        type: "string",
        in: "query",
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateParameterProperty(parameter, mockEndpoint, ctx);

      expect(result).toEqual("filter: string;");
    });

    it("should respect nullable flag modified by hook", () => {
      const hooks = createHooks({
        "parameter:generate": (ctx) => {
          ctx.tsCode.nullable = true;
        },
      });

      const parameter: IRParameterProperty = {
        name: "sort",
        type: "string",
        in: "query",
        required: true,
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateParameterProperty(parameter, mockEndpoint, ctx);

      expect(result).toEqual("sort: string | null;");
    });
  });

  describe("Default value handling", () => {
    it("should allow hook to customize default value", () => {
      const hooks = createHooks({
        "parameter:generate": (ctx) => {
          if (ctx.parameter.defaultValue) {
            ctx.tsCode.defaultValue = JSON.stringify(
              ctx.parameter.defaultValue,
            );
          }
        },
      });

      const parameter: IRParameterProperty = {
        name: "limit",
        type: "int",
        in: "query",
        defaultValue: 10,
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateParameterProperty(parameter, mockEndpoint, ctx);

      // Note: defaultValue は tsCode に設定されるが、
      // 実際の出力には含まれない（型定義のため）
      expect(result).toEqual("limit?: number | undefined;");
    });
  });

  describe("Comment modification", () => {
    it("should allow hook to add comment", () => {
      const hooks = createHooks({
        "parameter:generate": (ctx) => {
          ctx.tsCode.comment = "Custom parameter comment";
        },
      });

      const parameter: IRParameterProperty = {
        name: "id",
        type: "string",
        in: "path",
        required: true,
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateParameterProperty(parameter, mockEndpoint, ctx);

      expect(result).toEqual("/** Custom parameter comment */ id: string;");
    });

    it("should allow hook to modify existing comment", () => {
      const hooks = createHooks({
        "parameter:generate": (ctx) => {
          if (ctx.parameter.description) {
            ctx.tsCode.comment = `${ctx.parameter.description} (required)`;
          }
        },
      });

      const parameter: IRParameterProperty = {
        name: "userId",
        type: "string",
        in: "path",
        required: true,
        description: "User identifier",
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateParameterProperty(parameter, mockEndpoint, ctx);

      expect(result).toEqual(
        "/** User identifier (required) */ userId: string;",
      );
    });
  });

  describe("No hooks registered", () => {
    it("should work without hooks", () => {
      const parameter: IRParameterProperty = {
        name: "limit",
        type: "int",
        in: "query",
      };

      // hooks なしで呼び出し
      const ctx: TypeGenerationContext = { ir: mockIR, hooks: undefined };
      const result = generateParameterProperty(parameter, mockEndpoint, ctx);

      expect(result).toEqual("limit?: number | undefined;");
    });
  });

  describe("Complex scenarios", () => {
    it("should handle path parameter with custom type", () => {
      const hooks = createHooks({
        "parameter:generate": (ctx) => {
          if (ctx.parameter.in === "path" && ctx.extensions?.["x-type"]) {
            ctx.tsCode.typeName = ctx.extensions["x-type"] as string;
          }
        },
      });

      const parameter: IRParameterProperty = {
        name: "id",
        type: "string",
        in: "path",
        required: true,
        extensions: { "x-type": "UUID" },
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateParameterProperty(parameter, mockEndpoint, ctx);

      expect(result).toEqual("id: UUID;");
    });

    it("should handle header parameter with description", () => {
      const hooks = createHooks({
        "parameter:generate": (ctx) => {
          // Header パラメータに自動的にコメントを追加
          if (ctx.parameter.in === "header" && !ctx.tsCode.comment) {
            ctx.tsCode.comment = `HTTP Header: ${ctx.parameter.name}`;
          }
        },
      });

      const parameter: IRParameterProperty = {
        name: "Authorization",
        type: "string",
        in: "header",
        required: true,
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateParameterProperty(parameter, mockEndpoint, ctx);

      expect(result).toEqual(
        "/** HTTP Header: Authorization */ authorization: string;",
      );
    });

    it("should handle deprecated parameter", () => {
      const hooks = createHooks({
        "parameter:generate": (ctx) => {
          if (ctx.parameter.deprecated) {
            ctx.tsCode.comment = ctx.tsCode.comment
              ? `@deprecated ${ctx.tsCode.comment}`
              : "@deprecated";
          }
        },
      });

      const parameter: IRParameterProperty = {
        name: "oldParam",
        type: "string",
        in: "query",
        deprecated: true,
        description: "Use newParam instead",
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateParameterProperty(parameter, mockEndpoint, ctx);

      expect(result).toEqual(
        "/** @deprecated Use newParam instead */ oldParam?: string | undefined;",
      );
    });
  });

  describe("Parameter location specific handling", () => {
    it.each([
      {
        location: "path" as const,
        name: "id",
        expectedRequired: true,
        expected: "id: string;",
      },
      {
        location: "query" as const,
        name: "filter",
        expectedRequired: false,
        expected: "filter?: string | undefined;",
      },
      {
        location: "header" as const,
        name: "X-Custom-Header",
        expectedRequired: false,
        expected: "xCustomHeader?: string | undefined;",
      },
    ])(
      "should handle $location parameter correctly",
      ({ location, name, expectedRequired, expected }) => {
        const hooks = createHooks({
          "parameter:generate": (ctx) => {
            // Path パラメータは常に required
            if (ctx.parameter.in === "path") {
              ctx.tsCode.optional = false;
            }
          },
        });

        const parameter: IRParameterProperty = {
          name,
          type: "string",
          in: location,
          required: expectedRequired || undefined,
        };

        const result = generateParameterProperty(
          parameter,
          mockEndpoint,
          hooks,
        );

        expect(result).toEqual(expected);
      },
    );
  });
});
