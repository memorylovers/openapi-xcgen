import type { OpenAPIDocument, SchemaObject } from "../../types/index.js";
import type { IRModel, IRProperty, IRType } from "../../types/ir/index.js";

/**
 * Extract models from OpenAPI components.schemas
 * @param doc - OpenAPI document to extract from
 * @returns Array of IRModel definitions
 */
export function extractModels(doc: OpenAPIDocument): IRModel[] {
  if (!doc.components?.schemas) {
    return [];
  }

  const models: IRModel[] = [];

  for (const [name, schema] of Object.entries(doc.components.schemas)) {
    if (
      schema &&
      typeof schema === "object" &&
      "type" in schema &&
      schema.type === "object"
    ) {
      models.push(extractModel(name, schema));
    }
  }

  return models;
}

function extractModel(name: string, schema: SchemaObject): IRModel {
  return {
    name,
    description: schema.description,
    properties: extractProperties(schema),
  };
}

function extractProperties(schema: SchemaObject): IRProperty[] {
  if (!schema.properties) {
    return [];
  }

  const required = new Set(schema.required || []);
  const properties: IRProperty[] = [];

  for (const [name, prop] of Object.entries(schema.properties)) {
    properties.push({
      name,
      type: resolveType(prop as SchemaObject),
      required: required.has(name),
      description: (prop as SchemaObject).description,
    });
  }

  return properties;
}

function resolveType(schema: SchemaObject): IRType {
  // Handle $ref
  if ("$ref" in schema && typeof schema.$ref === "string") {
    return {
      kind: "ref",
      name: extractRefName(schema.$ref),
    };
  }

  // Handle array
  if (schema.type === "array") {
    return {
      kind: "array",
      itemType: resolveType(schema.items),
    };
  }

  // Handle object (as map)
  if (schema.type === "object") {
    return {
      kind: "map",
      valueType: { kind: "any" },
    };
  }

  // Handle primitive types
  const schemaType = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  const primitiveType = mapPrimitiveType(schemaType);
  return {
    kind: "primitive",
    type: primitiveType,
    format: schema.format,
  };
}

function extractRefName(ref: string): string {
  const parts = ref.split("/");
  return parts[parts.length - 1];
}

function mapPrimitiveType(
  type?: string,
): "string" | "number" | "integer" | "boolean" {
  // Map OpenAPI types to IR primitive types
  if (type === "integer") return "integer";
  if (type === "number") return "number";
  if (type === "string") return "string";
  if (type === "boolean") return "boolean";

  // Default to string for unknown types
  return "string";
}
