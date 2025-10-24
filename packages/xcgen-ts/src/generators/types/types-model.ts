/**
 * IRModel → TypeScript型変換
 *
 * IRModelをTypeScript型定義コード（interface, type, enum）に変換する
 */

import type { IRModel } from "@openapi-xcgen/core";
import { generateObjectType } from "./types-object";
import { generateEnumType } from "./types-enum";
import { generateArrayType } from "./types-array";
import { generateMapType } from "./types-map";
import { generateAllOfType } from "./types-allof";
import { generateAnyOfType } from "./types-anyof";
import { generateUnionType } from "./types-union";
import { generateParameterType } from "./types-parameter";

/**
 * IRModelをTypeScript型定義に変換
 *
 * @param model - IRモデル
 * @returns TypeScript型定義コード（null: 生成スキップ）
 *
 * @example
 * ```typescript
 * const model: IRModel = {
 *   kind: "object",
 *   name: "User",
 *   properties: [{ name: "email", type: "string", required: true }]
 * };
 * generateModel(model);
 * // => "export interface User {\n  email: string;\n}"
 * ```
 */
export function generateModel(model: IRModel): string | null {
  switch (model.kind) {
    case "object":
    case "requestBody":
    case "response":
      return generateObjectType(model);

    case "enum":
      return generateEnumType(model);

    case "array":
      return generateArrayType(model);

    case "map":
      return generateMapType(model);

    case "allOf":
      return generateAllOfType(model);

    case "anyOf":
      return generateAnyOfType(model);

    case "union":
      return generateUnionType(model);

    case "parameter":
      return generateParameterType(model);

    default: {
      // Exhaustive check
      const _: never = model;
      void _;
      return null;
    }
  }
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("generateModel", () => {
    it("should generate object type", () => {
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

      const result = generateModel(model);

      expect(result).toEqual(
        `
export interface User {
  email: string;
}
`.trim(),
      );
    });

    it("should generate enum type", () => {
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

      const result = generateModel(model);

      expect(result).toEqual('export type Status = "active" | "inactive";');
    });

    it("should generate array type", () => {
      const model: IRModel = {
        kind: "array",
        name: "UserList",
        referencePath: "#/components/schemas/UserList",
        itemType: { kind: "ref", name: "#/components/schemas/User" },
      };

      const result = generateModel(model);

      expect(result).toContain("export type UserList = Array<User>;");
    });

    it("should generate map type", () => {
      const model: IRModel = {
        kind: "map",
        name: "UserMap",
        referencePath: "#/components/schemas/UserMap",
        valueType: { kind: "ref", name: "#/components/schemas/User" },
      };

      const result = generateModel(model);

      expect(result).toContain("export type UserMap = Record<string, User>;");
    });

    it("should generate parameter type", () => {
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

      const result = generateModel(model);

      expect(result).toContain("export interface GetUserParams {");
      expect(result).toContain("path: {");
      expect(result).toContain("userId: string;");
    });

    it("should return null for unsupported models", () => {
      // Exhaustive checkのテスト - 実際には到達しないコード
      const model = {
        kind: "unsupported",
      } as unknown as IRModel;

      const result = generateModel(model);

      expect(result).toBeNull();
    });
  });
}
