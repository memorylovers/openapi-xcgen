/**
 * 型依存関係抽出
 *
 * IRModelから参照されている他の型を抽出する
 */

import type { IRModel, IRType } from "@openapi-xcgen/core";
import { toTypeName } from "../../../helpers/naming";

/**
 * モデルが参照する他の型を抽出
 *
 * @param model - IRModel
 * @returns 参照されている型名のSet
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
 * extractTypeDependencies(model);
 * // => Set { "User" }
 * ```
 */
export function extractTypeDependencies(model: IRModel): Set<string> {
  const dependencies = new Set<string>();

  function visitType(irType: IRType): void {
    if (typeof irType === "string") {
      return;
    }

    switch (irType.kind) {
      case "ref": {
        const modelName = irType.name.split("/").at(-1) ?? irType.name;
        dependencies.add(toTypeName(modelName));
        break;
      }
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

  describe("extractTypeDependencies", () => {
    it("should extract ref dependencies from object properties", () => {
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

      const result = extractTypeDependencies(model);

      expect(result).toEqual(new Set(["User", "Product"]));
    });

    it("should extract dependencies from IRArrayModel itself", () => {
      const model: IRModel = {
        kind: "array",
        name: "Items",
        referencePath: "#/components/schemas/Items",
        itemType: { kind: "ref", name: "#/components/schemas/Item" },
      };

      const result = extractTypeDependencies(model);

      expect(result).toEqual(new Set(["Item"]));
    });

    it("should extract dependencies from IRMapModel itself", () => {
      const model: IRModel = {
        kind: "map",
        name: "UserMap",
        referencePath: "#/components/schemas/UserMap",
        valueType: { kind: "ref", name: "#/components/schemas/User" },
      };

      const result = extractTypeDependencies(model);

      expect(result).toEqual(new Set(["User"]));
    });

    it("should extract dependencies from object with array ref property", () => {
      const model: IRModel = {
        kind: "object",
        name: "Cart",
        referencePath: "#/components/schemas/Cart",
        properties: [
          {
            name: "items",
            type: { kind: "ref", name: "#/components/schemas/CartItems" },
            required: true,
          },
        ],
      };

      const result = extractTypeDependencies(model);

      expect(result).toEqual(new Set(["CartItems"]));
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

      const result = extractTypeDependencies(model);

      expect(result).toEqual(new Set(["BaseUser", "Profile"]));
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

      const result = extractTypeDependencies(model);

      expect(result).toEqual(new Set(["Cat", "Dog"]));
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

      const result = extractTypeDependencies(model);

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

      const result = extractTypeDependencies(model);

      expect(result).toEqual(new Set());
    });
  });
}
