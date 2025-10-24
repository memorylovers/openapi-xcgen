/**
 * スキーマ依存関係抽出
 *
 * IRModelから参照されている他のスキーマを抽出する
 */

import type { IRModel, IRType } from "@openapi-xcgen/core";
import { toTypeName } from "../../../helpers/naming";

/**
 * モデルが参照する他のスキーマを抽出
 *
 * @param model - IRModel
 * @returns 参照されているスキーマ名のSet（"XxxSchema"形式）
 *
 * @example
 * ```typescript
 * const model: IRModel = {
 *   kind: "object",
 *   name: "Order",
 *   properties: [
 *     { name: "user", type: { kind: "ref", name: "#/components/schemas/User" } }
 *   ]
 * };
 * extractSchemaDependencies(model);
 * // => Set { "UserSchema" }
 * ```
 */
export function extractSchemaDependencies(model: IRModel): Set<string> {
  const dependencies = new Set<string>();

  function visitType(irType: IRType): void {
    if (typeof irType === "string") {
      return;
    }

    switch (irType.kind) {
      case "ref": {
        const modelName = irType.name.split("/").at(-1) ?? irType.name;
        const schemaName = `${toTypeName(modelName)}Schema`;
        dependencies.add(schemaName);
        break;
      }
      case "array":
        visitType(irType.itemType);
        break;
      case "map":
        visitType(irType.valueType);
        break;
    }
  }

  // モデルの種類に応じて依存関係を抽出
  switch (model.kind) {
    case "object":
    case "requestBody":
    case "response":
    case "parameter":
      if ("properties" in model) {
        for (const prop of model.properties) {
          visitType(prop.type);
        }
      }
      if ("additionalProperties" in model && model.additionalProperties) {
        visitType(model.additionalProperties);
      }
      break;

    case "array":
      visitType(model.itemType);
      break;

    case "map":
      visitType(model.valueType);
      break;

    case "allOf":
    case "anyOf":
      for (const type of model.schemas) {
        visitType(type);
      }
      break;

    case "union":
      for (const type of model.types) {
        visitType(type);
      }
      break;

    case "enum":
      // Enums don't reference other types
      break;
  }

  return dependencies;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("extractSchemaDependencies", () => {
    it("should extract schema dependencies from object properties", () => {
      const model: IRModel = {
        kind: "object",
        name: "Order",
        referencePath: "#/components/schemas/Order",
        properties: [
          {
            name: "user",
            type: { kind: "ref", name: "#/components/schemas/User" },
            required: true,
          },
          {
            name: "product",
            type: { kind: "ref", name: "#/components/schemas/Product" },
            required: true,
          },
        ],
      };

      const result = extractSchemaDependencies(model);

      expect(result).toEqual(new Set(["UserSchema", "ProductSchema"]));
    });

    it("should extract dependencies from nested arrays", () => {
      const model: IRModel = {
        kind: "object",
        name: "Cart",
        referencePath: "#/components/schemas/Cart",
        properties: [
          {
            name: "items",
            type: {
              kind: "array",
              itemType: { kind: "ref", name: "#/components/schemas/Item" },
            },
            required: true,
          },
        ],
      };

      const result = extractSchemaDependencies(model);

      expect(result).toEqual(new Set(["ItemSchema"]));
    });

    it("should extract dependencies from maps", () => {
      const model: IRModel = {
        kind: "object",
        name: "UserMap",
        referencePath: "#/components/schemas/UserMap",
        properties: [
          {
            name: "users",
            type: {
              kind: "map",
              valueType: { kind: "ref", name: "#/components/schemas/User" },
            },
            required: true,
          },
        ],
      };

      const result = extractSchemaDependencies(model);

      expect(result).toEqual(new Set(["UserSchema"]));
    });

    it("should extract dependencies from allOf schemas", () => {
      const model: IRModel = {
        kind: "allOf",
        name: "ExtendedUser",
        referencePath: "#/components/schemas/ExtendedUser",
        schemas: [
          { kind: "ref", name: "#/components/schemas/BaseUser" },
          { kind: "ref", name: "#/components/schemas/Profile" },
        ],
      };

      const result = extractSchemaDependencies(model);

      expect(result).toEqual(new Set(["BaseUserSchema", "ProfileSchema"]));
    });

    it("should extract dependencies from union types", () => {
      const model: IRModel = {
        kind: "union",
        name: "Pet",
        referencePath: "#/components/schemas/Pet",
        types: [
          { kind: "ref", name: "#/components/schemas/Cat" },
          { kind: "ref", name: "#/components/schemas/Dog" },
        ],
      };

      const result = extractSchemaDependencies(model);

      expect(result).toEqual(new Set(["CatSchema", "DogSchema"]));
    });

    it("should return empty set for enums", () => {
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

      const result = extractSchemaDependencies(model);

      expect(result).toEqual(new Set());
    });

    it("should return empty set for models with no dependencies", () => {
      const model: IRModel = {
        kind: "object",
        name: "Simple",
        referencePath: "#/components/schemas/Simple",
        properties: [
          {
            name: "name",
            type: "string",
            required: true,
          },
          {
            name: "count",
            type: "int",
            required: true,
          },
        ],
      };

      const result = extractSchemaDependencies(model);

      expect(result).toEqual(new Set());
    });
  });
}
