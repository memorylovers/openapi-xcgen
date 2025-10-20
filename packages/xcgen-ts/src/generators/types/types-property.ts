/**
 * TypeScriptプロパティ生成
 *
 * IRPropertyからTypeScriptのプロパティ定義を生成する
 */

import type { IRProperty } from "@openapi-xcgen/core";
import { toPropertyName } from "../../helpers/naming.js";
import {
  applyTypeModifiers,
  irTypeToTsType,
} from "../../helpers/type-mapper.js";

/**
 * IRPropertyからTypeScriptプロパティ定義を生成
 * @param prop - IRProperty
 * @returns TypeScriptプロパティ定義文字列
 *
 * @example
 * ```typescript
 * const prop: IRProperty = {
 *   name: "email",
 *   type: "string",
 *   required: true,
 * };
 * generateProperty(prop);
 * // => "email: string;"
 * ```
 */
export function generateProperty(prop: IRProperty): string {
  const propName = toPropertyName(prop.name);
  const baseType = irTypeToTsType(prop.type);

  // 型修飾子を適用
  const fullType = applyTypeModifiers(baseType, {
    nullable: prop.nullable,
    optional: !prop.required,
  });

  // readonly修飾子
  const readonly = prop.readOnly ? "readonly " : "";

  // optional演算子
  const optional = !prop.required ? "?" : "";

  // JSDocコメント（inline）
  let jsdoc = "";
  if (prop.description) {
    jsdoc = `/** ${prop.description} */ `;
  }

  return `${jsdoc}${readonly}${propName}${optional}: ${fullType};`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("types-property", () => {
    describe("generateProperty", () => {
      it("should generate required property", () => {
        const prop: IRProperty = {
          name: "email",
          type: "string",
          required: true,
        };

        const result = generateProperty(prop);

        expect(result).toBe("email: string;");
      });

      it("should generate optional property", () => {
        const prop: IRProperty = {
          name: "phone",
          type: "string",
        };

        const result = generateProperty(prop);

        expect(result).toBe("phone?: string | undefined;");
      });

      it("should generate readonly property", () => {
        const prop: IRProperty = {
          name: "id",
          type: "int",
          required: true,
          readOnly: true,
        };

        const result = generateProperty(prop);

        expect(result).toBe("readonly id: number;");
      });

      it("should generate nullable property", () => {
        const prop: IRProperty = {
          name: "deletedAt",
          type: "string",
          nullable: true,
          required: true,
        };

        const result = generateProperty(prop);

        expect(result).toBe("deletedAt: string | null;");
      });

      it("should generate property with description", () => {
        const prop: IRProperty = {
          name: "name",
          type: "string",
          required: true,
          description: "User name",
        };

        const result = generateProperty(prop);

        expect(result).toBe("/** User name */ name: string;");
      });
    });
  });
}
