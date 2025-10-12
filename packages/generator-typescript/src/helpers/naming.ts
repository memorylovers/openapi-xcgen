/**
 * 命名変換ヘルパー
 *
 * OpenAPIのモデル名やエンドポイント名をTypeScriptの命名規則に変換する
 */

import { camelCase, pascalCase } from "es-toolkit/string";

/**
 * モデル名をTypeScript型名（PascalCase）に変換
 * @param name - IR model name
 * @returns TypeScript type name in PascalCase
 *
 * @example
 * ```typescript
 * toTypeName("user_profile") // => "UserProfile"
 * toTypeName("Pet") // => "Pet"
 * ```
 */
export function toTypeName(name: string): string {
  return pascalCase(name);
}

/**
 * プロパティ名をTypeScriptプロパティ名（camelCase）に変換
 * @param name - property name
 * @returns TypeScript property name in camelCase
 *
 * @example
 * ```typescript
 * toPropertyName("user_id") // => "userId"
 * toPropertyName("email") // => "email"
 * ```
 */
export function toPropertyName(name: string): string {
  return camelCase(name);
}

/**
 * 関数名をTypeScript関数名（camelCase）に変換
 * @param name - function name or operationId
 * @returns TypeScript function name in camelCase
 *
 * @example
 * ```typescript
 * toFunctionName("GetUsers") // => "getUsers"
 * toFunctionName("create_user") // => "createUser"
 * ```
 */
export function toFunctionName(name: string): string {
  return camelCase(name);
}

/**
 * スキーマ名をValibot/Zod schemaスキーマ名に変換
 * @param typeName - TypeScript type name
 * @returns Schema name with "Schema" suffix
 *
 * @example
 * ```typescript
 * toSchemaName("Pet") // => "PetSchema"
 * toSchemaName("UserProfile") // => "UserProfileSchema"
 * ```
 */
export function toSchemaName(typeName: string): string {
  return `${typeName}Schema`;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("naming helpers", () => {
    describe("toTypeName", () => {
      it("should convert snake_case to PascalCase", () => {
        expect(toTypeName("user_profile")).toBe("UserProfile");
      });

      it("should keep PascalCase as is", () => {
        expect(toTypeName("Pet")).toBe("Pet");
      });

      it("should handle kebab-case", () => {
        expect(toTypeName("user-profile")).toBe("UserProfile");
      });
    });

    describe("toPropertyName", () => {
      it("should convert snake_case to camelCase", () => {
        expect(toPropertyName("user_id")).toBe("userId");
      });

      it("should keep camelCase as is", () => {
        expect(toPropertyName("email")).toBe("email");
      });
    });

    describe("toFunctionName", () => {
      it("should convert PascalCase to camelCase", () => {
        expect(toFunctionName("GetUsers")).toBe("getUsers");
      });

      it("should convert snake_case to camelCase", () => {
        expect(toFunctionName("create_user")).toBe("createUser");
      });
    });

    describe("toSchemaName", () => {
      it("should add Schema suffix", () => {
        expect(toSchemaName("Pet")).toBe("PetSchema");
        expect(toSchemaName("UserProfile")).toBe("UserProfileSchema");
      });
    });
  });
}
