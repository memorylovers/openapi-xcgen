/**
 * TypeScript Parameter Property生成
 *
 * IRParameterPropertyからTypeScriptのプロパティ定義を生成する
 * parameter:generate Hook対応
 */

import type { IREndpoint, IRParameterProperty } from "@openapi-xcgen/core";
import { toPropertyName } from "../../helpers/naming";
import { applyTypeModifiers, irTypeToTsType } from "../../helpers/type-mapper";
import type { HookableInstance, TsCodeParameter } from "../../hooks";

/**
 * IRParameterPropertyからTypeScriptプロパティ定義を生成（parameter:generate Hook対応）
 * @param param - IRParameterProperty
 * @param endpoint - 所属エンドポイント（Hook用のコンテキスト、オプショナル）
 * @param hooks - Hook instance（オプション）
 * @returns TypeScriptプロパティ定義文字列
 *
 * @example エンドポイントありの場合
 * ```typescript
 * const param: IRParameterProperty = {
 *   name: "userId",
 *   type: "string",
 *   in: "path",
 *   required: true,
 * };
 * const endpoint: IREndpoint = {
 *   path: "/users/{userId}",
 *   method: "get",
 *   operationId: "getUser",
 *   // ...
 * };
 * generateParameterProperty(param, endpoint);
 * // => "userId: string;"
 * ```
 *
 * @example エンドポイントなしの場合（パラメータモデル生成時）
 * ```typescript
 * const param: IRParameterProperty = {
 *   name: "limit",
 *   type: "int",
 *   in: "query",
 * };
 * generateParameterProperty(param);
 * // => "limit?: number | undefined;"
 * ```
 */
export function generateParameterProperty(
  param: IRParameterProperty,
  endpoint?: IREndpoint,
  hooks?: HookableInstance,
): string {
  const propName = toPropertyName(param.name);
  const baseType = irTypeToTsType(param.type);

  // 1. TsCodeParameter を初期化（Hookが変更可能）
  const tsCode: TsCodeParameter = {
    name: propName,
    typeName: baseType,
    optional: !param.required,
    nullable: param.nullable ?? false,
    defaultValue: param.defaultValue
      ? JSON.stringify(param.defaultValue)
      : undefined,
    comment: param.description,
  };

  // 2. parameter:generate Hook を呼び出し（同期、純粋関数）
  if (hooks) {
    hooks.callHook("parameter:generate", {
      parameter: param,
      endpoint,
      tsCode,
      extensions: param.extensions,
    });
  }

  // 3. 最終的な tsCode から TypeScript コードを生成
  const fullType = applyTypeModifiers(tsCode.typeName, {
    nullable: tsCode.nullable,
    optional: tsCode.optional,
  });

  // optional演算子
  const optional = tsCode.optional ? "?" : "";

  // JSDocコメント（inline）
  let jsdoc = "";
  if (tsCode.comment) {
    jsdoc = `/** ${tsCode.comment} */ `;
  }

  return `${jsdoc}${tsCode.name}${optional}: ${fullType};`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("types-parameter-property", () => {
    describe("generateParameterProperty", () => {
      it("should generate required path parameter", () => {
        const param: IRParameterProperty = {
          name: "id",
          type: "string",
          in: "path",
          required: true,
        };

        const result = generateParameterProperty(param);

        expect(result).toBe("id: string;");
      });

      it("should generate optional query parameter", () => {
        const param: IRParameterProperty = {
          name: "limit",
          type: "int",
          in: "query",
        };

        const result = generateParameterProperty(param);

        expect(result).toBe("limit?: number | undefined;");
      });

      it("should generate nullable parameter", () => {
        const param: IRParameterProperty = {
          name: "filter",
          type: "string",
          in: "query",
          nullable: true,
          required: true,
        };

        const result = generateParameterProperty(param);

        expect(result).toBe("filter: string | null;");
      });

      it("should generate parameter with description", () => {
        const param: IRParameterProperty = {
          name: "userId",
          type: "string",
          in: "path",
          required: true,
          description: "User ID",
        };

        const result = generateParameterProperty(param);

        expect(result).toBe("/** User ID */ userId: string;");
      });

      it("should generate header parameter with correct naming", () => {
        const param: IRParameterProperty = {
          name: "X-Api-Key",
          type: "string",
          in: "header",
          required: true,
        };

        const result = generateParameterProperty(param);

        expect(result).toBe("xApiKey: string;");
      });

      it("should generate cookie parameter", () => {
        const param: IRParameterProperty = {
          name: "session",
          type: "string",
          in: "cookie",
          required: true,
        };

        const result = generateParameterProperty(param);

        expect(result).toBe("session: string;");
      });

      it("should generate optional nullable parameter", () => {
        const param: IRParameterProperty = {
          name: "sortBy",
          type: "string",
          in: "query",
          nullable: true,
        };

        const result = generateParameterProperty(param);

        expect(result).toBe("sortBy?: string | null | undefined;");
      });
    });
  });
}
