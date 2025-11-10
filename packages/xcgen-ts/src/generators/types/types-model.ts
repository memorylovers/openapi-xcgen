/**
 * IRComponent → TypeScript型変換
 *
 * IRComponentをTypeScript型定義コード（interface, type, enum）に変換する
 */

import type { IRComponent } from "@openapi-xcgen/core";
import type { TypeGenerationContext } from "./generation-context";
import { generateAllOfType } from "./types-allof";
import { generateAnyOfType } from "./types-anyof";
import { generateArrayType } from "./types-array";
import { generateEnumType } from "./types-enum";
import { generateMapType } from "./types-map";
import { generateObjectType } from "./types-object";
import { generateParameterType } from "./types-parameter";
import { generateUnionType } from "./types-union";

/**
 * IRComponentをTypeScript型定義に変換
 *
 * @param model - IRコンポーネント
 * @param ctx - Type generation context
 * @returns TypeScript型定義コード（null: 生成スキップ）
 *
 * @example
 * ```typescript
 * const model: IRComponent = {
 *   kind: "object",
 *   name: "User",
 *   properties: [{ name: "email", type: "string", required: true }]
 * };
 * await generateModel(model, ctx);
 * // => "export interface User {\n  email: string;\n}"
 * ```
 */
export function generateModel(
  model: IRComponent,
  ctx: TypeGenerationContext,
): string | null {
  switch (model.kind) {
    case "object":
    case "requestBody":
    case "response":
      return generateObjectType(model, ctx);

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
      return generateParameterType(model, ctx);

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
  const mockCtx: TypeGenerationContext = {
    ir: {
      metadata: { title: "Test API", version: "1.0.0" },
      components: [],
      tags: [],
      endpoints: [],
    },
  };
  const { describe, it, expect } = import.meta.vitest;

  describe("generateModel", () => {
    it("should generate object type", () => {
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

      const result = generateModel(model, mockCtx);

      expect(result).toEqual(
        `
export interface User {
  email: string;
}
`.trim(),
      );
    });

    it("should generate enum type", () => {
      const model: IRComponent = {
        kind: "enum",
        name: "Status",
        referencePath: "#/components/schemas/Status",
        type: "string",
        values: [
          { value: "active", name: "ACTIVE" },
          { value: "inactive", name: "INACTIVE" },
        ],
      };

      const result = generateModel(model, mockCtx);

      expect(result).toEqual('export type Status = "active" | "inactive";');
    });

    it("should generate array type", () => {
      const model: IRComponent = {
        kind: "array",
        name: "UserList",
        referencePath: "#/components/schemas/UserList",
        itemType: { kind: "ref", referencePath: "#/components/schemas/User" },
      };

      const result = generateModel(model, mockCtx);

      expect(result).toContain("export type UserList = Array<User>;");
    });

    it("should generate map type", () => {
      const model: IRComponent = {
        kind: "map",
        name: "UserMap",
        referencePath: "#/components/schemas/UserMap",
        valueType: { kind: "ref", referencePath: "#/components/schemas/User" },
      };

      const result = generateModel(model, mockCtx);

      expect(result).toContain("export type UserMap = Record<string, User>;");
    });

    it("should generate parameter type", () => {
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

      const result = generateModel(model, mockCtx);

      expect(result).toContain("export interface GetUserParams {");
      expect(result).toContain("path: {");
      expect(result).toContain("userId: string;");
    });

    it("should return null for unsupported models", () => {
      // Exhaustive checkのテスト - 実際には到達しないコード
      const model = {
        kind: "unsupported",
      } as unknown as IRComponent;

      const result = generateModel(model, mockCtx);

      expect(result).toBeNull();
    });
  });
}
