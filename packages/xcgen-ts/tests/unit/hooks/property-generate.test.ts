/**
 * property:generate Hook の統合テスト
 *
 * generateProperty() と Hook 機構の統合動作を検証
 */

import type { IRModel, IRProperty } from "@openapi-xcgen/core";
import { describe, expect, it } from "vitest";
import { generateProperty } from "../../../src/generators/types/types-property";
import { createHooks } from "../../../src/hooks";

describe("property:generate hook", () => {
  const mockModel: IRModel = {
    kind: "object",
    name: "User",
    referencePath: "#/components/schemas/User",
    properties: [],
  };

  describe("Custom type transformation (x-type)", () => {
    it.each([
      {
        description: "should transform string to EmailAddress",
        property: {
          name: "email",
          type: "string",
          extensions: { "x-type": "EmailAddress" },
        } as IRProperty,
        expected: "email?: EmailAddress | undefined;",
      },
      {
        description: "should not transform when x-type is not present",
        property: {
          name: "name",
          type: "string",
          required: true,
        } as IRProperty,
        expected: "name: string;",
      },
      {
        description: "should transform number to PositiveInteger",
        property: {
          name: "age",
          type: "int",
          required: true,
          extensions: { "x-type": "PositiveInteger" },
        } as IRProperty,
        expected: "age: PositiveInteger;",
      },
    ])("$description", ({ property, expected }) => {
      const hooks = createHooks({
        "property:generate": (ctx) => {
          if (ctx.extensions?.["x-type"]) {
            ctx.tsCode.typeName = ctx.extensions["x-type"] as string;
          }
        },
      });

      const result = generateProperty(property, mockModel, hooks);

      expect(result).toEqual(expected);
    });
  });

  describe("Multiple hooks execution", () => {
    it("should execute multiple hooks in order", () => {
      const calls: string[] = [];

      const hooks = createHooks({
        "property:generate": [
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

      const property: IRProperty = {
        name: "data",
        type: "string",
      };

      const result = generateProperty(property, mockModel, hooks);

      expect(calls).toEqual(["hook1", "hook2"]);
      expect(result).toEqual("data?: Type1 | Type2 | undefined;");
    });

    it("should allow hooks to cooperate", () => {
      const hooks = createHooks({
        "property:generate": [
          (ctx) => {
            // Hook1: x-type を適用
            if (ctx.extensions?.["x-type"]) {
              ctx.tsCode.typeName = ctx.extensions["x-type"] as string;
            }
          },
          (ctx) => {
            // Hook2: 特定の型に対してさらに変換
            if (ctx.tsCode.typeName === "EmailAddress") {
              ctx.tsCode.comment = "Email address (RFC 5322)";
            }
          },
        ],
      });

      const property: IRProperty = {
        name: "email",
        type: "string",
        extensions: { "x-type": "EmailAddress" },
      };

      const result = generateProperty(property, mockModel, hooks);

      expect(result).toEqual(
        "/** Email address (RFC 5322) */ email?: EmailAddress | undefined;",
      );
    });
  });

  describe("Optional and nullable handling", () => {
    it("should respect optional flag modified by hook", () => {
      const hooks = createHooks({
        "property:generate": (ctx) => {
          ctx.tsCode.optional = false; // 強制的にrequiredに変更
        },
      });

      const property: IRProperty = {
        name: "requiredField",
        type: "string",
      };

      const result = generateProperty(property, mockModel, hooks);

      expect(result).toEqual("requiredField: string;");
    });

    it("should respect nullable flag modified by hook", () => {
      const hooks = createHooks({
        "property:generate": (ctx) => {
          ctx.tsCode.nullable = true; // nullableに変更
        },
      });

      const property: IRProperty = {
        name: "nullableField",
        type: "string",
        required: true,
      };

      const result = generateProperty(property, mockModel, hooks);

      expect(result).toEqual("nullableField: string | null;");
    });

    it("should combine optional and nullable modifications", () => {
      const hooks = createHooks({
        "property:generate": (ctx) => {
          ctx.tsCode.optional = true;
          ctx.tsCode.nullable = true;
        },
      });

      const property: IRProperty = {
        name: "field",
        type: "string",
        required: true,
      };

      const result = generateProperty(property, mockModel, hooks);

      expect(result).toEqual("field?: string | null | undefined;");
    });
  });

  describe("Comment modification", () => {
    it("should allow hook to add comment", () => {
      const hooks = createHooks({
        "property:generate": (ctx) => {
          ctx.tsCode.comment = "Custom comment";
        },
      });

      const property: IRProperty = {
        name: "field",
        type: "string",
        required: true,
      };

      const result = generateProperty(property, mockModel, hooks);

      expect(result).toEqual("/** Custom comment */ field: string;");
    });

    it("should allow hook to modify existing comment", () => {
      const hooks = createHooks({
        "property:generate": (ctx) => {
          if (ctx.property.description) {
            ctx.tsCode.comment = `${ctx.property.description} (modified)`;
          }
        },
      });

      const property: IRProperty = {
        name: "field",
        type: "string",
        required: true,
        description: "Original description",
      };

      const result = generateProperty(property, mockModel, hooks);

      expect(result).toEqual(
        "/** Original description (modified) */ field: string;",
      );
    });
  });

  describe("No hooks registered", () => {
    it("should work without hooks", () => {
      const property: IRProperty = {
        name: "email",
        type: "string",
      };

      // hooksなしで呼び出し
      const result = generateProperty(property, mockModel);

      expect(result).toEqual("email?: string | undefined;");
    });
  });

  describe("Complex scenarios", () => {
    it("should handle readonly property with hook", () => {
      const hooks = createHooks({
        "property:generate": (ctx) => {
          if (ctx.extensions?.["x-type"]) {
            ctx.tsCode.typeName = ctx.extensions["x-type"] as string;
          }
        },
      });

      const property: IRProperty = {
        name: "id",
        type: "int",
        required: true,
        readOnly: true,
        extensions: { "x-type": "ID" },
      };

      const result = generateProperty(property, mockModel, hooks);

      expect(result).toEqual("readonly id: ID;");
    });

    it("should handle property with default value", () => {
      const hooks = createHooks({
        "property:generate": (ctx) => {
          // Hook は tsCode を変更するが、defaultValue は IR に残る
          ctx.tsCode.typeName = "CustomString";
        },
      });

      const property: IRProperty = {
        name: "status",
        type: "string",
        defaultValue: "active",
      };

      const result = generateProperty(property, mockModel, hooks);

      expect(result).toEqual("status?: CustomString | undefined;");
    });
  });
});
