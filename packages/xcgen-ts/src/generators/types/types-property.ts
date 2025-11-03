/**
 * TypeScriptプロパティ生成
 *
 * IRPropertyからTypeScriptのプロパティ定義を生成する
 */

import type { IRComponent, IRProperty } from "@openapi-xcgen/core";
import { toPropertyName } from "../../helpers/naming";
import { applyTypeModifiers, irTypeToTsType } from "../../helpers/type-mapper";
import type { HookableInstance } from "../../hooks/create-hooks";

/**
 * IRPropertyからTypeScriptプロパティ定義を生成
 * @param prop - IRProperty
 * @param model - 親モデル（Hook用のコンテキスト）
 * @param hooks - Hook instance（オプション）
 * @returns TypeScriptプロパティ定義文字列
 *
 * @example
 * ```typescript
 * const prop: IRProperty = {
 *   name: "email",
 *   type: "string",
 *   required: true,
 * };
 * const model: IRComponent = {
 *   kind: "object",
 *   name: "User",
 *   referencePath: "#/components/schemas/User",
 *   properties: []
 * };
 * generateProperty(prop, model);
 * // => "email: string;"
 * ```
 */
export function generateProperty(
  prop: IRProperty,
  model: IRComponent,
  hooks?: HookableInstance,
): string {
  const propName = toPropertyName(prop.name);
  const baseType = irTypeToTsType(prop.type);

  // 1. TsCodeProperty を初期化（Hookが変更可能）
  const tsCode = {
    typeName: baseType,
    optional: !prop.required,
    nullable: prop.nullable ?? false,
    comment: prop.description,
  };

  // 2. Hook を呼び出し（同期、純粋関数）
  if (hooks) {
    hooks.callHook("property:generate", {
      property: prop,
      model,
      tsCode,
      extensions: prop.extensions,
    });
  }

  // 3. 最終的な tsCode から TypeScript コードを生成
  const fullType = applyTypeModifiers(tsCode.typeName, {
    nullable: tsCode.nullable,
    optional: tsCode.optional,
  });

  // readonly修飾子
  const readonly = prop.readOnly ? "readonly " : "";

  // optional演算子
  const optional = tsCode.optional ? "?" : "";

  // JSDocコメント（inline）
  let jsdoc = "";
  if (tsCode.comment) {
    jsdoc = `/** ${tsCode.comment} */ `;
  }

  return `${jsdoc}${readonly}${propName}${optional}: ${fullType};`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  const mockModel: IRComponent = {
    kind: "object",
    name: "TestModel",
    referencePath: "#/components/schemas/TestModel",
    properties: [],
  };

  describe("types-property", () => {
    describe("generateProperty", () => {
      it("should generate required property", () => {
        const prop: IRProperty = {
          name: "email",
          type: "string",
          required: true,
        };

        const result = generateProperty(prop, mockModel);

        expect(result).toBe("email: string;");
      });

      it("should generate optional property", () => {
        const prop: IRProperty = {
          name: "phone",
          type: "string",
        };

        const result = generateProperty(prop, mockModel);

        expect(result).toBe("phone?: string | undefined;");
      });

      it("should generate readonly property", () => {
        const prop: IRProperty = {
          name: "id",
          type: "int",
          required: true,
          readOnly: true,
        };

        const result = generateProperty(prop, mockModel);

        expect(result).toBe("readonly id: number;");
      });

      it("should generate nullable property", () => {
        const prop: IRProperty = {
          name: "deletedAt",
          type: "string",
          nullable: true,
          required: true,
        };

        const result = generateProperty(prop, mockModel);

        expect(result).toBe("deletedAt: string | null;");
      });

      it("should generate property with description", () => {
        const prop: IRProperty = {
          name: "name",
          type: "string",
          required: true,
          description: "User name",
        };

        const result = generateProperty(prop, mockModel);

        expect(result).toBe("/** User name */ name: string;");
      });
    });
  });
}
