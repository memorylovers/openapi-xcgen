/**
 * IR型からTypeScript型文字列への変換
 *
 * IRTypeをTypeScriptの型表現に変換するヘルパー関数
 */

import type { IRType } from "@openapi-xcgen/core";
import { toTypeName } from "./naming.js";

/**
 * IRTypeをTypeScript型文字列に変換
 * @param irType - IR type from Core
 * @returns TypeScript type string
 *
 * @example
 * ```typescript
 * irTypeToTsType("string") // => "string"
 * irTypeToTsType({ kind: "ref", name: "Pet" }) // => "Pet"
 * irTypeToTsType({ kind: "array", itemType: "string" })
 * // => "Array<string>"
 * ```
 */
export function irTypeToTsType(irType: IRType): string {
  // IRScalarType (string literal)
  if (typeof irType === "string") {
    switch (irType) {
      case "string":
      case "byte": // Base64-encoded string
        return "string";
      case "date":
      case "datetime":
        return "Date";
      case "binary": // Raw binary data (images, PDFs, etc.)
        return "Blob";
      case "int":
      case "long":
      case "float":
      case "double":
        return "number";
      case "boolean":
        return "boolean";
      case "null":
        return "null";
      default:
        return "unknown";
    }
  }

  // IRRef, IRArray, IRMap (objects with kind property)
  switch (irType.kind) {
    case "ref": {
      // $refから型名を抽出してPascalCaseに変換
      // Core packageはreference path全体を保存: "#/components/schemas/Base"
      // 最後のセグメントを抽出: "Base"
      const modelName = irType.name.split("/").at(-1) ?? irType.name;
      return toTypeName(modelName);
    }

    case "array": {
      const itemType = irTypeToTsType(irType.itemType);
      return `Array<${itemType}>`;
    }

    case "map": {
      const valueType = irTypeToTsType(irType.valueType);
      return `Record<string, ${valueType}>`;
    }

    default: {
      // TypeScriptはデフォルトケースでexhaustiveチェックを行う
      const _exhaustiveCheck: never = irType;
      return "unknown";
    }
  }
}

/**
 * nullable/optional修飾子を適用してTypeScript型文字列を生成
 * @param baseType - 基本型文字列
 * @param options - オプション
 * @returns 修飾子付きTypeScript型文字列
 *
 * @example
 * ```typescript
 * applyTypeModifiers("string", { optional: true })
 * // => "string | undefined"
 *
 * applyTypeModifiers("Pet", { nullable: true })
 * // => "Pet | null"
 *
 * applyTypeModifiers("User", { optional: true, nullable: true })
 * // => "User | null | undefined"
 * ```
 */
export function applyTypeModifiers(
  baseType: string,
  options: {
    optional?: boolean;
    nullable?: boolean;
  } = {},
): string {
  const modifiers: string[] = [baseType];

  if (options.nullable) {
    modifiers.push("null");
  }

  if (options.optional) {
    modifiers.push("undefined");
  }

  return modifiers.join(" | ");
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("type-mapper", () => {
    describe("irTypeToTsType", () => {
      it("should convert scalar types", () => {
        expect(irTypeToTsType("string")).toBe("string");
        expect(irTypeToTsType("int")).toBe("number");
        expect(irTypeToTsType("long")).toBe("number");
        expect(irTypeToTsType("float")).toBe("number");
        expect(irTypeToTsType("double")).toBe("number");
        expect(irTypeToTsType("boolean")).toBe("boolean");
        expect(irTypeToTsType("date")).toBe("Date");
        expect(irTypeToTsType("datetime")).toBe("Date");
      });

      it("should convert binary types correctly", () => {
        // byte: Base64-encoded string
        expect(irTypeToTsType("byte")).toBe("string");
        // binary: Raw binary data (Blob)
        expect(irTypeToTsType("binary")).toBe("Blob");
      });

      it("should convert ref types", () => {
        expect(irTypeToTsType({ kind: "ref", name: "Pet" })).toBe("Pet");
        expect(irTypeToTsType({ kind: "ref", name: "user_profile" })).toBe(
          "UserProfile",
        );
      });

      it("should convert array types", () => {
        expect(
          irTypeToTsType({
            kind: "array",
            itemType: "string",
          }),
        ).toBe("Array<string>");

        expect(
          irTypeToTsType({
            kind: "array",
            itemType: { kind: "ref", name: "Pet" },
          }),
        ).toBe("Array<Pet>");
      });

      it("should convert map types", () => {
        expect(
          irTypeToTsType({
            kind: "map",
            valueType: "int",
          }),
        ).toBe("Record<string, number>");
      });
    });

    describe("applyTypeModifiers", () => {
      it("should return base type without modifiers", () => {
        expect(applyTypeModifiers("string")).toBe("string");
      });

      it("should add nullable modifier", () => {
        expect(applyTypeModifiers("Pet", { nullable: true })).toBe(
          "Pet | null",
        );
      });

      it("should add optional modifier", () => {
        expect(applyTypeModifiers("string", { optional: true })).toBe(
          "string | undefined",
        );
      });

      it("should add both nullable and optional modifiers", () => {
        expect(
          applyTypeModifiers("User", { optional: true, nullable: true }),
        ).toBe("User | null | undefined");
      });
    });
  });
}
