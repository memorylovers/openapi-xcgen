/**
 * validation:transform Hook の統合テスト
 *
 * generateValidationPipes() と Hook 機構の統合動作を検証
 */

import type { IRValidation } from "@openapi-xcgen/core";
import { describe, expect, it } from "vitest";
import { generateValidationPipes } from "../../../src/generators/schemas/schemas-validation";
import { createHooks } from "../../../src/hooks";

describe("validation:transform hook", () => {
  describe("Custom validation pipes", () => {
    it("should add custom validation pipe", () => {
      const hooks = createHooks({
        "validation:transform": (ctx) => {
          // x-custom-validation 拡張でカスタムバリデーションを追加
          if (ctx.extensions?.["x-custom-validation"]) {
            ctx.tsCode.pipes.push(
              `v.custom(${ctx.extensions["x-custom-validation"]})`,
            );
          }
        },
      });

      const validation: IRValidation = {
        minLength: 1,
      };

      const result = generateValidationPipes(validation, "string", hooks, {
        "x-custom-validation": "isUnique",
      });

      expect(result).toEqual(["v.minLength(1)", "v.custom(isUnique)"]);
    });

    it("should replace validation pipes entirely", () => {
      const hooks = createHooks({
        "validation:transform": (ctx) => {
          // 全てのバリデーションを置き換え
          ctx.tsCode.pipes = ["v.custom(myValidator)"];
        },
      });

      const validation: IRValidation = {
        minLength: 1,
        maxLength: 100,
      };

      const result = generateValidationPipes(validation, "string", hooks);

      expect(result).toEqual(["v.custom(myValidator)"]);
    });

    it("should remove specific validation pipes", () => {
      const hooks = createHooks({
        "validation:transform": (ctx) => {
          // minLength バリデーションを削除
          ctx.tsCode.pipes = ctx.tsCode.pipes.filter(
            (pipe) => !pipe.includes("minLength"),
          );
        },
      });

      const validation: IRValidation = {
        minLength: 1,
        maxLength: 100,
        pattern: "^[a-z]+$",
      };

      const result = generateValidationPipes(validation, "string", hooks);

      expect(result).toEqual(["v.maxLength(100)", "v.regex(/^[a-z]+$/)"]);
    });
  });

  describe("Multiple hooks execution", () => {
    it("should execute multiple hooks in order", () => {
      const calls: string[] = [];

      const hooks = createHooks({
        "validation:transform": [
          (ctx) => {
            calls.push("hook1");
            ctx.tsCode.pipes.push("v.hook1()");
          },
          (ctx) => {
            calls.push("hook2");
            ctx.tsCode.pipes.push("v.hook2()");
          },
        ],
      });

      const validation: IRValidation = {
        minLength: 1,
      };

      const result = generateValidationPipes(validation, "string", hooks);

      expect(calls).toEqual(["hook1", "hook2"]);
      expect(result).toEqual(["v.minLength(1)", "v.hook1()", "v.hook2()"]);
    });

    it("should allow hooks to cooperate", () => {
      const hooks = createHooks({
        "validation:transform": [
          (ctx) => {
            // Hook1: x-validation 拡張を追加
            if (ctx.extensions?.["x-validation"]) {
              ctx.tsCode.pipes.push(
                `v.custom(${ctx.extensions["x-validation"]})`,
              );
            }
          },
          (ctx) => {
            // Hook2: email バリデーションがある場合、カスタムバリデーションを追加
            const hasEmail = ctx.tsCode.pipes.some((pipe) =>
              pipe.includes("email"),
            );
            if (hasEmail) {
              ctx.tsCode.pipes.push("v.custom(isEmailDomain)");
            }
          },
        ],
      });

      const validation: IRValidation = {
        format: "email",
      };

      const result = generateValidationPipes(validation, "string", hooks, {
        "x-validation": "isUnique",
      });

      expect(result).toEqual([
        "v.email()",
        "v.custom(isUnique)",
        "v.custom(isEmailDomain)",
      ]);
    });
  });

  describe("No hooks registered", () => {
    it("should work without hooks", () => {
      const validation: IRValidation = {
        minLength: 1,
        maxLength: 100,
      };

      const result = generateValidationPipes(validation, "string");

      expect(result).toEqual(["v.minLength(1)", "v.maxLength(100)"]);
    });

    it("should return empty array for undefined validation", () => {
      const result = generateValidationPipes(undefined, "string");

      expect(result).toEqual([]);
    });
  });

  describe("Different validation types", () => {
    it("should work with number validations", () => {
      const hooks = createHooks({
        "validation:transform": (ctx) => {
          // x-precision 拡張で精度バリデーションを追加
          if (ctx.extensions?.["x-precision"]) {
            ctx.tsCode.pipes.push(
              `v.custom((v) => Number.isInteger(v * ${ctx.extensions["x-precision"]}))`,
            );
          }
        },
      });

      const validation: IRValidation = {
        minimum: 0,
        maximum: 100,
      };

      const result = generateValidationPipes(validation, "int", hooks, {
        "x-precision": 2,
      });

      expect(result).toEqual([
        "v.minValue(0)",
        "v.maxValue(100)",
        "v.custom((v) => Number.isInteger(v * 2))",
      ]);
    });

    it("should work with format validations", () => {
      const hooks = createHooks({
        "validation:transform": (ctx) => {
          // uuid バリデーションに追加のチェックを追加
          const hasUuid = ctx.tsCode.pipes.some((pipe) =>
            pipe.includes("uuid"),
          );
          if (hasUuid) {
            ctx.tsCode.pipes.push("v.custom(isValidUuidVersion)");
          }
        },
      });

      const validation: IRValidation = {
        format: "uuid",
      };

      const result = generateValidationPipes(validation, "string", hooks);

      expect(result).toEqual(["v.uuid()", "v.custom(isValidUuidVersion)"]);
    });

    it("should work with pattern validations", () => {
      const hooks = createHooks({
        "validation:transform": (ctx) => {
          // pattern がある場合、x-pattern-description を追加
          const hasPattern = ctx.tsCode.pipes.some((pipe) =>
            pipe.includes("regex"),
          );
          if (hasPattern && ctx.extensions?.["x-pattern-description"]) {
            ctx.tsCode.pipes.push(
              `v.description("${ctx.extensions["x-pattern-description"]}")`,
            );
          }
        },
      });

      const validation: IRValidation = {
        pattern: "^[A-Z]{2}\\d{6}$",
      };

      const result = generateValidationPipes(validation, "string", hooks, {
        "x-pattern-description": "Country code followed by 6 digits",
      });

      expect(result).toEqual([
        "v.regex(/^[A-Z]{2}\\\\d{6}$/)",
        'v.description("Country code followed by 6 digits")',
      ]);
    });
  });

  describe("Complex scenarios", () => {
    it("should handle complex validation with multiple extensions", () => {
      const hooks = createHooks({
        "validation:transform": (ctx) => {
          // x-sanitize: 値をサニタイズ
          if (ctx.extensions?.["x-sanitize"]) {
            ctx.tsCode.pipes.unshift("v.transform(sanitize)");
          }

          // x-deprecated-validation: 非推奨バリデーションを警告に変換
          if (ctx.extensions?.["x-deprecated-validation"]) {
            ctx.tsCode.pipes.push(
              'v.custom((v) => (console.warn("Deprecated validation"), true))',
            );
          }
        },
      });

      const validation: IRValidation = {
        minLength: 1,
        maxLength: 100,
        pattern: "^[a-zA-Z0-9]+$",
      };

      const result = generateValidationPipes(validation, "string", hooks, {
        "x-sanitize": true,
        "x-deprecated-validation": true,
      });

      expect(result).toEqual([
        "v.transform(sanitize)",
        "v.minLength(1)",
        "v.maxLength(100)",
        "v.regex(/^[a-zA-Z0-9]+$/)",
        'v.custom((v) => (console.warn("Deprecated validation"), true))',
      ]);
    });

    it("should handle conditional validation based on type", () => {
      const hooks = createHooks({
        "validation:transform": (ctx) => {
          // Array型の場合、各要素にバリデーションを追加
          if (typeof ctx.type !== "string" && ctx.type.kind === "array") {
            ctx.tsCode.pipes.push("v.custom(validateArrayItems)");
          }
        },
      });

      const validation: IRValidation = {
        minLength: 1,
        maxLength: 10,
      };

      const arrayType = { kind: "array" as const, itemType: "string" as const };

      const result = generateValidationPipes(validation, arrayType, hooks);

      expect(result).toEqual([
        "v.minLength(1)",
        "v.maxLength(10)",
        "v.custom(validateArrayItems)",
      ]);
    });
  });
});
