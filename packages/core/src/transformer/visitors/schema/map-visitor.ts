import { consola } from "consola";
import type {
  IRMapModel,
  IRModel,
  IRType,
  SchemaObjectWithNullable,
} from "../../../types";
import { buildReferencePath } from "../../helpers";
import type { VisitorContext } from "../../types";
import { visitSchema } from "./schema-visitor";

export interface MapVisitorResult {
  type: IRType | null;
  models: IRModel[];
}

/**
 * additionalPropertiesのみを持つスキーマをIRMapModelに変換する。
 */
export function visitMap(
  schema: SchemaObjectWithNullable,
  context: VisitorContext,
): MapVisitorResult {
  const result: MapVisitorResult = {
    type: null,
    models: [],
  };

  const additional = schema.additionalProperties;
  if (additional === undefined) {
    return result;
  }

  const referencePath = buildReferencePath(context.documentPath);
  const name = context.documentPath.at(-1) ?? "";

  if (!name.trim()) {
    consola.warn("Invalid model name: empty or whitespace only");
    return result;
  }

  let valueType: IRType | null = null;
  const nestedModels: IRModel[] = [];

  if (additional === true) {
    consola.warn(
      "additionalProperties: true (any type) is not fully supported yet",
    );
    valueType = "string";
  } else if (additional === false) {
    return result;
  } else {
    const valueContext: VisitorContext = {
      documentPath: [...context.documentPath.slice(0, -1), `${name}Value`],
      rootSegment: context.rootSegment,
    };
    const valueResult = visitSchema(
      additional as SchemaObjectWithNullable,
      valueContext,
    );

    if (!valueResult.type) {
      consola.warn(
        `Failed to process additionalProperties-only schema: ${referencePath}`,
      );
      return result;
    }

    nestedModels.push(...valueResult.models);
    valueType = valueResult.type;
  }

  if (!valueType) {
    consola.warn(
      `Failed to process additionalProperties-only schema: ${referencePath}`,
    );
    return result;
  }

  const mapModel: IRMapModel = {
    kind: "map",
    name,
    referencePath,
    valueType,
    ...(schema.description && { description: schema.description }),
  };

  result.models.push(mapModel, ...nestedModels);
  result.type = {
    kind: "ref",
    name: referencePath,
  };

  return result;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitMap", () => {
    it("should create map model with primitive value", () => {
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "StringMap"],
        rootSegment: "components",
      };
      const schema: SchemaObjectWithNullable = {
        type: "object",
        additionalProperties: { type: "string" },
      };

      const result = visitMap(schema, context);

      expect(result).toEqual({
        type: { kind: "ref", name: "#/components/schemas/StringMap" },
        models: [
          {
            kind: "map",
            name: "StringMap",
            referencePath: "#/components/schemas/StringMap",
            valueType: "string",
          },
        ],
      });
    });

    it("should propagate nested models for complex values", () => {
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "ArrayMap"],
        rootSegment: "components",
      };
      const schema: SchemaObjectWithNullable = {
        type: "object",
        additionalProperties: {
          type: "array",
          items: { type: "string" },
        },
      };

      const result = visitMap(schema, context);

      expect(result).toEqual({
        type: { kind: "ref", name: "#/components/schemas/ArrayMap" },
        models: [
          {
            kind: "map",
            name: "ArrayMap",
            referencePath: "#/components/schemas/ArrayMap",
            valueType: {
              kind: "ref",
              name: "#/components/schemas/ArrayMapValue",
            },
          },
          {
            kind: "array",
            name: "ArrayMapValue",
            referencePath: "#/components/schemas/ArrayMapValue",
            itemType: "string",
          },
        ],
      });
    });

    it("should warn when value type is unsupported", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "AnyMap"],
        rootSegment: "components",
      };
      const schema: SchemaObjectWithNullable = {
        type: "object",
        additionalProperties: true,
      };

      const result = visitMap(schema, context);

      expect(result).toEqual({
        type: { kind: "ref", name: "#/components/schemas/AnyMap" },
        models: [
          {
            kind: "map",
            name: "AnyMap",
            referencePath: "#/components/schemas/AnyMap",
            valueType: "string",
          },
        ],
      });
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
}
