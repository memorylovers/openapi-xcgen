/**
 * バリデーションpipe生成
 */

import type { IRExtensions, IRType, IRValidation } from "@openapi-xcgen/core";
import type { HookableInstance, TsCodeValidation } from "../../hooks";

/**
 * IRValidationからValibotのバリデーションpipesを生成
 * @param validation - IRバリデーション情報
 * @param type - IR型（Hook context用）
 * @param hooks - Hook instance（オプション）
 * @param extensions - x-extensions（Hook context用、オプション）
 * @returns Valibotバリデーション配列（pipe用）
 *
 * @example
 * ```typescript
 * generateValidationPipes({
 *   minLength: 1,
 *   maxLength: 100,
 *   pattern: "^[a-z]+$"
 * }, "string")
 * // => ["v.minLength(1)", "v.maxLength(100)", "v.regex(/^[a-z]+$/)"]
 * ```
 */
export function generateValidationPipes(
  validation: IRValidation | undefined,
  type: IRType,
  hooks?: HookableInstance,
  extensions?: IRExtensions,
): string[] {
  if (!validation) {
    return [];
  }

  const pipes: string[] = [];

  // String validations
  if (validation.minLength !== undefined) {
    pipes.push(`v.minLength(${validation.minLength})`);
  }

  if (validation.maxLength !== undefined) {
    pipes.push(`v.maxLength(${validation.maxLength})`);
  }

  if (validation.pattern) {
    // パターンをエスケープして正規表現リテラルとして使用
    const escapedPattern = validation.pattern.replace(/\\/g, "\\\\");
    pipes.push(`v.regex(/${escapedPattern}/)`);
  }

  // Number validations
  if (validation.minimum !== undefined) {
    pipes.push(`v.minValue(${validation.minimum})`);
  }

  if (validation.maximum !== undefined) {
    pipes.push(`v.maxValue(${validation.maximum})`);
  }

  // Format validations
  if (validation.format) {
    switch (validation.format) {
      case "email":
        pipes.push("v.email()");
        break;
      case "uuid":
        pipes.push("v.uuid()");
        break;
      case "url":
      case "uri":
        pipes.push("v.url()");
        break;
      // 他のformatは現時点ではスキップ（ipv4, ipv6等）
      // 注: date/date-timeはIRValidation.formatから除外されているため、ここでは処理されない
    }
  }

  // validation:transform Hook を呼び出し
  if (hooks) {
    const tsCode: TsCodeValidation = {
      pipes: [...pipes], // コピーを渡す
    };

    hooks.callHook("validation:transform", {
      validation,
      type,
      tsCode,
      extensions,
    });

    // Hook で変更された pipes を返す
    return tsCode.pipes;
  }

  return pipes;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("schemas-validation", () => {
    describe("generateValidationPipes", () => {
      it("should return empty array when validation is undefined", () => {
        const result = generateValidationPipes(undefined, "string");
        expect(result).toEqual([]);
      });

      it("should generate minLength pipe", () => {
        const result = generateValidationPipes({ minLength: 1 }, "string");
        expect(result).toEqual(["v.minLength(1)"]);
      });

      it("should generate maxLength pipe", () => {
        const result = generateValidationPipes({ maxLength: 100 }, "string");
        expect(result).toEqual(["v.maxLength(100)"]);
      });

      it("should generate pattern pipe", () => {
        const result = generateValidationPipes(
          { pattern: "^[a-z]+$" },
          "string",
        );
        expect(result).toEqual(["v.regex(/^[a-z]+$/)"]);
      });

      it("should generate minimum pipe", () => {
        const result = generateValidationPipes({ minimum: 0 }, "int");
        expect(result).toEqual(["v.minValue(0)"]);
      });

      it("should generate maximum pipe", () => {
        const result = generateValidationPipes({ maximum: 100 }, "int");
        expect(result).toEqual(["v.maxValue(100)"]);
      });

      it("should generate email format pipe", () => {
        const result = generateValidationPipes({ format: "email" }, "string");
        expect(result).toEqual(["v.email()"]);
      });

      it("should generate uuid format pipe", () => {
        const result = generateValidationPipes({ format: "uuid" }, "string");
        expect(result).toEqual(["v.uuid()"]);
      });

      it("should generate url format pipe", () => {
        const result = generateValidationPipes({ format: "url" }, "string");
        expect(result).toEqual(["v.url()"]);
      });

      it("should generate multiple pipes", () => {
        const result = generateValidationPipes(
          {
            minLength: 1,
            maxLength: 100,
            pattern: "^[a-z]+$",
          },
          "string",
        );
        expect(result).toEqual([
          "v.minLength(1)",
          "v.maxLength(100)",
          "v.regex(/^[a-z]+$/)",
        ]);
      });

      it("should handle pattern with backslashes", () => {
        const result = generateValidationPipes({ pattern: "\\d+" }, "string");
        expect(result).toEqual(["v.regex(/\\\\d+/)"]);
      });
    });
  });
}
