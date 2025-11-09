/**
 * schemaFile:generate Hook の統合テスト
 *
 * generateSchemaFile() と Hook 機構の統合動作を検証
 */

import type { IRComponent, XcgenIR } from "@openapi-xcgen/core";
import { describe, expect, it } from "vitest";
import type { TypeGenerationContext } from "../../../src/generators/types/generation-context";
import { generateSchemaFile } from "../../../src/generators/schemas/helpers/generate-schema-file";
import { createHooks } from "../../../src/hooks";

describe("schemaFile:generate hook", () => {
  const mockIR: XcgenIR = {
    metadata: { title: "Test API", version: "1.0.0" },
    components: [],
    tags: [],
    endpoints: [],
  };

  describe("Custom imports for schema files", () => {
    it("should call schemaFile:generate hook with actual schema code", () => {
      const model: IRComponent = {
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

      let hookCalled = false;
      let receivedCode = "";

      const hooks = createHooks({
        "schemaFile:generate": (ctx) => {
          hookCalled = true;
          receivedCode = ctx.tsCode.code;
          // 実際のスキーマコードが渡されていることを確認
          expect(ctx.tsCode.code).toContain("v.object({");
          expect(ctx.tsCode.code).toContain("email: v.string()");
          expect(ctx.model.name).toBe("User");
        },
      });

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateSchemaFile(model, ctx);

      expect(hookCalled).toBe(true);
      expect(receivedCode).not.toBe("");
      expect(result).toContain("export const UserSchema = v.object({");
    });

    it("should add custom imports from hook", () => {
      const model: IRComponent = {
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

      const hooks = createHooks({
        "schemaFile:generate": (ctx) => {
          // カスタムバリデーター関数のインポートを追加
          ctx.tsCode.imports.push(
            "import { validateEmail } from '../validators'",
          );
        },
      });

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateSchemaFile(model, ctx);

      expect(result).toContain("import { validateEmail } from '../validators'");
      expect(result).toContain("export const UserSchema = v.object({");
    });

    it("should add multiple custom imports from hook", () => {
      const model: IRComponent = {
        kind: "object",
        name: "Order",
        referencePath: "#/components/schemas/Order",
        properties: [
          {
            name: "userId",
            type: "string",
            required: true,
          },
          {
            name: "productId",
            type: "string",
            required: true,
          },
        ],
      };

      const hooks = createHooks({
        "schemaFile:generate": (ctx) => {
          ctx.tsCode.imports.push(
            "import { validateUserId } from '../validators/user'",
          );
          ctx.tsCode.imports.push(
            "import { validateProductId } from '../validators/product'",
          );
        },
      });

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateSchemaFile(model, ctx);

      expect(result).toContain(
        "import { validateUserId } from '../validators/user'",
      );
      expect(result).toContain(
        "import { validateProductId } from '../validators/product'",
      );
      expect(result).toContain("export const OrderSchema = v.object({");
    });

    it("should add type imports using type name syntax", () => {
      const model: IRComponent = {
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

      const hooks = createHooks({
        "schemaFile:generate": (ctx) => {
          // 型名のみを指定（import文が自動生成される）
          ctx.tsCode.imports.push("CustomValidator");
        },
      });

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateSchemaFile(model, ctx);

      // processImports() により自動的にimport文が生成される
      expect(result).toContain(
        "import { CustomValidator } from './CustomValidator'",
      );
    });

    it("should not call hook when hooks is not provided", () => {
      const model: IRComponent = {
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

      const ctx: TypeGenerationContext = { ir: mockIR }; // hooks なし
      const result = generateSchemaFile(model, ctx);

      // フックなしでも正常に動作
      expect(result).toContain("export const UserSchema = v.object({");
      expect(result).not.toContain("../validators");
    });
  });

  describe("Hook called only once per model", () => {
    it("should call schemaFile:generate hook exactly once", () => {
      const model: IRComponent = {
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

      let callCount = 0;

      const hooks = createHooks({
        "schemaFile:generate": () => {
          callCount++;
        },
      });

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      generateSchemaFile(model, ctx);

      // 1回だけ呼ばれることを確認（2重呼び出しバグの回帰テスト）
      expect(callCount).toBe(1);
    });
  });

  describe("Extensions support", () => {
    it("should pass extensions to hook", () => {
      const model: IRComponent = {
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
        extensions: { "x-custom-validator": "email" },
      };

      let receivedExtensions;

      const hooks = createHooks({
        "schemaFile:generate": (ctx) => {
          receivedExtensions = ctx.extensions;
        },
      });

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      generateSchemaFile(model, ctx);

      expect(receivedExtensions).toEqual({ "x-custom-validator": "email" });
    });

    it("should not pass extensions when not present", () => {
      const model: IRComponent = {
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

      let receivedExtensions;

      const hooks = createHooks({
        "schemaFile:generate": (ctx) => {
          receivedExtensions = ctx.extensions;
        },
      });

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      generateSchemaFile(model, ctx);

      // parameter モデルには extensions がないので undefined
      expect(receivedExtensions).toBeUndefined();
    });
  });

  describe("Hook can modify code and comment", () => {
    it("should reflect modified tsCode.code in final output", () => {
      const model: IRComponent = {
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

      const hooks = createHooks({
        "schemaFile:generate": (ctx) => {
          // スキーマコードを書き換え
          ctx.tsCode.code = "export const UserSchema = v.custom(() => true);";
        },
      });

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateSchemaFile(model, ctx);

      // フックで変更したコードが反映されている
      expect(result).toContain(
        "export const UserSchema = v.custom(() => true);",
      );
      // 元のコードは含まれていない
      expect(result).not.toContain("v.object({");
    });

    it("should reflect modified tsCode.comment in file header", () => {
      const model: IRComponent = {
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

      const hooks = createHooks({
        "schemaFile:generate": (ctx) => {
          // コメントを書き換え
          ctx.tsCode.comment =
            "Custom User Schema\nGenerated with custom logic";
        },
      });

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateSchemaFile(model, ctx);

      // フックで変更したコメントが反映されている
      expect(result).toContain(" * Custom User Schema");
      expect(result).toContain(" * Generated with custom logic");
      // 元のコメントは含まれていない
      expect(result).not.toContain("Valibot validation schema for User");
      expect(result).not.toContain("Auto-generated from OpenAPI specification");
    });

    it("should handle multiline comment correctly", () => {
      const model: IRComponent = {
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
      };

      const hooks = createHooks({
        "schemaFile:generate": (ctx) => {
          ctx.tsCode.comment = "Line 1\nLine 2\nLine 3";
        },
      });

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateSchemaFile(model, ctx);

      expect(result).toContain(" * Line 1");
      expect(result).toContain(" * Line 2");
      expect(result).toContain(" * Line 3");
    });
  });

  describe("JSDoc comment escaping", () => {
    it("should escape comment terminator in default comment", () => {
      const model: IRComponent = {
        kind: "object",
        name: "Pattern*/Model",
        referencePath: "#/components/schemas/Pattern*/Model",
        properties: [
          {
            name: "value",
            type: "string",
            required: true,
          },
        ],
      };

      const ctx: TypeGenerationContext = { ir: mockIR };
      const result = generateSchemaFile(model, ctx);

      // */ should be escaped to *\/
      expect(result).toContain(
        " * Valibot validation schema for Pattern*\\/Model",
      );
      expect(result).not.toMatch(/ \* .*Pattern\*\/Model/); // Unescaped */ should not exist
    });

    it("should escape comment terminator in custom comment", () => {
      const model: IRComponent = {
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

      const hooks = createHooks({
        "schemaFile:generate": (ctx) => {
          ctx.tsCode.comment = "Use pattern: */";
        },
      });

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateSchemaFile(model, ctx);

      // */ should be escaped to *\/
      expect(result).toContain(" * Use pattern: *\\/");
      expect(result).not.toContain(" * Use pattern: */"); // Unescaped
    });

    it("should escape multiple comment terminators", () => {
      const model: IRComponent = {
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

      const hooks = createHooks({
        "schemaFile:generate": (ctx) => {
          ctx.tsCode.comment = "Start */ middle */ end";
        },
      });

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateSchemaFile(model, ctx);

      // All */ should be escaped
      expect(result).toContain(" * Start *\\/ middle *\\/ end");
    });

    it("should not modify text without comment terminators", () => {
      const model: IRComponent = {
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

      const hooks = createHooks({
        "schemaFile:generate": (ctx) => {
          ctx.tsCode.comment = "Normal text with * and / separately";
        },
      });

      const ctx: TypeGenerationContext = { ir: mockIR, hooks };
      const result = generateSchemaFile(model, ctx);

      // Should not modify
      expect(result).toContain(" * Normal text with * and / separately");
    });
  });
});
