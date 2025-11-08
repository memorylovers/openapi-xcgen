/**
 * modelFile:generate Hook の統合テスト
 *
 * generateModelFile() と Hook 機構の統合動作を検証
 */

import type { IRModel, XcgenIR } from "@openapi-xcgen/core";
import { describe, expect, it } from "vitest";
import type { TypeGenerationContext } from "../../../src/generators/types/generation-context";
import { generateModelFile } from "../../../src/generators/types/helpers/generate-model-file";
import { createHooks } from "../../../src/hooks";

describe("modelFile:generate hook", () => {
  const mockIR: XcgenIR = {
    metadata: { title: "Test API", version: "1.0.0" },
    components: [],
    tags: [],
    endpoints: [],
  };

  describe("Custom model name transformation (x-model-name)", () => {
    it.each([
      {
        description: "should transform model name using x-model-name extension",
        model: {
          kind: "object",
          name: "User",
          referencePath: "#/components/schemas/User",
          properties: [
            {
              name: "email",
              type: "string",
              required: true,
            },
          ],
          extensions: { "x-model-name": "CustomUser" },
        } satisfies IRModel,
        expected: `/**
 * User model
 * Auto-generated from OpenAPI specification
 */

export interface CustomUser {
  email: string;
}`,
      },
      {
        description: "should not transform when x-model-name is not present",
        model: {
          kind: "object",
          name: "Product",
          referencePath: "#/components/schemas/Product",
          properties: [
            {
              name: "name",
              type: "string",
              required: true,
            },
          ],
        } satisfies IRModel,
        expected: `/**
 * Product model
 * Auto-generated from OpenAPI specification
 */

export interface Product {
  name: string;
}`,
      },
    ])("$description", ({ model, expected }) => {
      const hooks = createHooks({
        "modelFile:generate": (ctx) => {
          if (ctx.extensions?.["x-model-name"]) {
            ctx.tsCode.name = ctx.extensions["x-model-name"] as string;
          }
        },
      });

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateModelFile(model, undefined, ctx);

      expect(result).toEqual(expected);
    });
  });

  describe("Code modification", () => {
    it("should allow hook to modify generated code", () => {
      const hooks = createHooks({
        "modelFile:generate": (ctx) => {
          // コードの末尾にカスタム型を追加
          ctx.tsCode.code = ctx.tsCode.code.replace(
            /}$/,
            "  // Custom field added by hook\n}",
          );
        },
      });

      const model: IRModel = {
        kind: "object",
        name: "User",
        referencePath: "#/components/schemas/User",
        properties: [
          {
            name: "email",
            type: "string",
            required: true,
          },
        ],
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateModelFile(model, undefined, ctx);

      expect(result).toEqual(`/**
 * User model
 * Auto-generated from OpenAPI specification
 */

export interface User {
  email: string;
  // Custom field added by hook
}`);
    });

    it("should allow hook to replace entire code", () => {
      const hooks = createHooks({
        "modelFile:generate": (ctx) => {
          ctx.tsCode.code = `export type ${ctx.tsCode.name} = { custom: true };`;
        },
      });

      const model: IRModel = {
        kind: "object",
        name: "Simple",
        referencePath: "#/components/schemas/Simple",
        properties: [],
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateModelFile(model, undefined, ctx);

      expect(result).toEqual(`/**
 * Simple model
 * Auto-generated from OpenAPI specification
 */

export type Simple = { custom: true };`);
    });
  });

  describe("Import addition", () => {
    it("should allow hook to add imports", () => {
      const hooks = createHooks({
        "modelFile:generate": (ctx) => {
          // Hookでインポートを追加
          ctx.tsCode.imports.push("CustomType");
          ctx.tsCode.imports.push("AnotherType");
        },
      });

      const model: IRModel = {
        kind: "object",
        name: "User",
        referencePath: "#/components/schemas/User",
        properties: [
          {
            name: "email",
            type: "string",
            required: true,
          },
        ],
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateModelFile(model, undefined, ctx);

      expect(result).toEqual(`/**
 * User model
 * Auto-generated from OpenAPI specification
 */

import type { AnotherType } from './AnotherType';
import type { CustomType } from './CustomType';

export interface User {
  email: string;
}`);
    });

    it("should merge hook imports with dependency imports", () => {
      const hooks = createHooks({
        "modelFile:generate": (ctx) => {
          ctx.tsCode.imports.push("ExternalType");
        },
      });

      const model: IRModel = {
        kind: "object",
        name: "Order",
        referencePath: "#/components/schemas/Order",
        properties: [
          {
            name: "user",
            type: { kind: "ref", referencePath: "#/components/schemas/User" },
            required: true,
          },
        ],
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateModelFile(model, undefined, ctx);

      expect(result).toEqual(`/**
 * Order model
 * Auto-generated from OpenAPI specification
 */

import type { ExternalType } from './ExternalType';
import type { User } from './User';

export interface Order {
  user: User;
}`);
    });
  });

  describe("Comment modification", () => {
    it("should allow hook to modify comment", () => {
      const hooks = createHooks({
        "modelFile:generate": (ctx) => {
          ctx.tsCode.comment = "Custom model comment\nWith multiple lines";
        },
      });

      const model: IRModel = {
        kind: "object",
        name: "User",
        referencePath: "#/components/schemas/User",
        properties: [
          {
            name: "email",
            type: "string",
            required: true,
          },
        ],
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateModelFile(model, undefined, ctx);

      expect(result).toEqual(`/**
 * Custom model comment
 * With multiple lines
 */

export interface User {
  email: string;
}`);
    });

    it("should allow hook to append to existing comment", () => {
      const hooks = createHooks({
        "modelFile:generate": (ctx) => {
          // Append custom metadata to comment
          ctx.tsCode.comment = `${ctx.tsCode.comment}\n\nGenerated with custom hook`;
        },
      });

      const model: IRModel = {
        kind: "object",
        name: "User",
        referencePath: "#/components/schemas/User",
        properties: [
          {
            name: "email",
            type: "string",
            required: true,
          },
        ],
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateModelFile(model, undefined, ctx);

      expect(result).toEqual(`/**
 * User model
 * Auto-generated from OpenAPI specification
 * 
 * Generated with custom hook
 */

export interface User {
  email: string;
}`);
    });
  });

  describe("Multiple hooks execution", () => {
    it("should execute multiple hooks in order", () => {
      const calls: string[] = [];

      const hooks = createHooks({
        "modelFile:generate": [
          (ctx) => {
            calls.push("hook1");
            ctx.tsCode.name = "Modified1";
          },
          (ctx) => {
            calls.push("hook2");
            ctx.tsCode.name = `${ctx.tsCode.name}AndMore`;
          },
        ],
      });

      const model: IRModel = {
        kind: "object",
        name: "User",
        referencePath: "#/components/schemas/User",
        properties: [
          {
            name: "email",
            type: "string",
            required: true,
          },
        ],
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateModelFile(model, undefined, ctx);

      expect(calls).toEqual(["hook1", "hook2"]);
      expect(result).toEqual(`/**
 * User model
 * Auto-generated from OpenAPI specification
 */

export interface Modified1AndMore {
  email: string;
}`);
    });

    it("should allow hooks to cooperate", () => {
      const hooks = createHooks({
        "modelFile:generate": [
          (ctx) => {
            // Hook1: x-model-name を適用
            if (ctx.extensions?.["x-model-name"]) {
              ctx.tsCode.name = ctx.extensions["x-model-name"] as string;
            }
          },
          (ctx) => {
            // Hook2: 特定のモデルにインポート追加
            if (ctx.tsCode.name === "CustomUser") {
              ctx.tsCode.imports.push("CustomValidator");
            }
          },
        ],
      });

      const model: IRModel = {
        kind: "object",
        name: "User",
        referencePath: "#/components/schemas/User",
        properties: [
          {
            name: "email",
            type: "string",
            required: true,
          },
        ],
        extensions: { "x-model-name": "CustomUser" },
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateModelFile(model, undefined, ctx);

      expect(result).toEqual(`/**
 * User model
 * Auto-generated from OpenAPI specification
 */

import type { CustomValidator } from './CustomValidator';

export interface CustomUser {
  email: string;
}`);
    });
  });

  describe("No hooks registered", () => {
    it("should work without hooks", () => {
      const model: IRModel = {
        kind: "object",
        name: "User",
        referencePath: "#/components/schemas/User",
        properties: [
          {
            name: "email",
            type: "string",
            required: true,
          },
        ],
      };

      // hooks なしで呼び出し
      const ctx: TypeGenerationContext = { ir: mockIR, hooks: undefined };
      const result = generateModelFile(model, undefined, ctx);

      expect(result).toEqual(`/**
 * User model
 * Auto-generated from OpenAPI specification
 */

export interface User {
  email: string;
}`);
    });
  });

  describe("Different model kinds", () => {
    it("should work with enum model", () => {
      const hooks = createHooks({
        "modelFile:generate": (ctx) => {
          ctx.tsCode.comment = `Enum: ${ctx.model.name}`;
        },
      });

      const model: IRModel = {
        kind: "enum",
        name: "Status",
        referencePath: "#/components/schemas/Status",
        type: "string",
        values: [
          { value: "active", name: "ACTIVE" },
          { value: "inactive", name: "INACTIVE" },
        ],
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateModelFile(model, undefined, ctx);

      expect(result).toEqual(`/**
 * Enum: Status
 */

export type Status = "active" | "inactive";`);
    });

    it("should work with array model", () => {
      const hooks = createHooks({
        "modelFile:generate": (ctx) => {
          ctx.tsCode.imports.push("CustomArrayHelper");
        },
      });

      const model: IRModel = {
        kind: "array",
        name: "UserList",
        referencePath: "#/components/schemas/UserList",
        itemType: { kind: "ref", referencePath: "#/components/schemas/User" },
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateModelFile(model, undefined, ctx);

      expect(result).toEqual(`/**
 * UserList model
 * Auto-generated from OpenAPI specification
 */

import type { CustomArrayHelper } from './CustomArrayHelper';
import type { User } from './User';

export type UserList = Array<User>;`);
    });

    it("should work with parameter model", () => {
      const hooks = createHooks({
        "modelFile:generate": (ctx) => {
          if (ctx.model.kind === "parameter") {
            ctx.tsCode.comment = "Parameter model with custom hook";
          }
        },
      });

      const model: IRModel = {
        kind: "parameter",
        name: "GetUserParams",
        referencePath: "#/paths/~1users~1{userId}/get/parameters",
        properties: [
          {
            name: "userId",
            type: "string",
            required: true,
            in: "path",
          },
        ],
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateModelFile(model, undefined, ctx);

      expect(result).toEqual(`/**
 * Parameter model with custom hook
 */

export interface GetUserParams {
  path: {
    userId: string;
  };
}`);
    });
  });

  describe("Complex scenarios", () => {
    it("should handle model with dependencies and hook imports", () => {
      const hooks = createHooks({
        "modelFile:generate": (ctx) => {
          // モデル名を変更
          ctx.tsCode.name = `Enhanced${ctx.tsCode.name}`;
          // インポートを追加
          ctx.tsCode.imports.push("Validator");
          // コメントを追加
          ctx.tsCode.comment = `Enhanced version\n\n${ctx.tsCode.comment}`;
        },
      });

      const model: IRModel = {
        kind: "object",
        name: "Order",
        referencePath: "#/components/schemas/Order",
        properties: [
          {
            name: "user",
            type: { kind: "ref", referencePath: "#/components/schemas/User" },
            required: true,
          },
          {
            name: "product",
            type: {
              kind: "ref",
              referencePath: "#/components/schemas/Product",
            },
            required: true,
          },
        ],
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateModelFile(model, undefined, ctx);

      expect(result).toEqual(`/**
 * Enhanced version
 * 
 * Order model
 * Auto-generated from OpenAPI specification
 */

import type { Product } from './Product';
import type { User } from './User';
import type { Validator } from './Validator';

export interface EnhancedOrder {
  user: User;
  product: Product;
}`);
    });

    it("should handle unified parameter type with hook", () => {
      const hooks = createHooks({
        "modelFile:generate": (ctx) => {
          ctx.tsCode.comment = "Unified parameter type with request body";
        },
      });

      const model: IRModel = {
        kind: "parameter",
        name: "UpdateUserParams",
        referencePath: "#/paths/~1users~1{userId}/patch/parameters",
        properties: [
          {
            name: "userId",
            type: "string",
            required: true,
            in: "path",
          },
        ],
      };

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateModelFile(model, "UserUpdate", ctx);

      expect(result).toEqual(`/**
 * Unified parameter type with request body
 */

import type { UserUpdate } from './UserUpdate';

export interface UpdateUserParams {
  path: {
    userId: string;
  };
  body: UserUpdate;
}`);
    });
  });
});
