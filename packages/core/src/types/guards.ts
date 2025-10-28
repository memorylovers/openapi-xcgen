import type {
  AdditionalPropertiesContext,
  AllOfContext,
  AnyOfContext,
  OneOfContext,
  ParameterContext,
  PathsRequestBodyContext,
  PathsResponseContext,
  RequestBodyContext,
  ResponseContext,
  VisitorContext,
} from "../transformer/types";
import type {
  ArraySchemaObject,
  IRAllOfModel,
  IRModel,
  NonArraySchemaObject,
  ReferenceObject,
  SchemaObject,
} from "./index";

/**
 * オブジェクトが$ref参照オブジェクトかどうかを判定
 */
export function isReferenceObject(obj: unknown): obj is ReferenceObject {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === "object" &&
    "$ref" in obj
  );
}

/**
 * IRModelがIRAllOfModelかどうかを判定
 */
export function isIRAllOfModel(model: IRModel): model is IRAllOfModel {
  return model.kind === "allOf";
}

/**
 * 文字列がComposition型（allOf/oneOf/anyOf）かどうかを判定
 */
export function isCompositionType(
  value: string,
): value is "allOf" | "oneOf" | "anyOf" {
  return value === "allOf" || value === "oneOf" || value === "anyOf";
}

/**
 * VisitorContextがCompositionContext（AllOf/OneOf/AnyOf）かどうかを判定
 */
export function isCompositionContext(
  context: VisitorContext,
): context is AllOfContext | OneOfContext | AnyOfContext {
  return (
    context.kind === "allOf" ||
    context.kind === "oneOf" ||
    context.kind === "anyOf"
  );
}

/**
 * VisitorContextがAdditionalPropertiesContextかどうかを判定
 */
export function isAdditionalPropertiesContext(
  context: VisitorContext,
): context is AdditionalPropertiesContext {
  return context.kind === "additionalProperties";
}

/**
 * VisitorContextがParameterContextかどうかを判定
 */
export function isParameterContext(
  context: VisitorContext,
): context is ParameterContext {
  return context.kind === "parameter";
}

/**
 * VisitorContextがRequestBodyContextかどうかを判定
 */
export function isRequestBodyContext(
  context: VisitorContext,
): context is RequestBodyContext {
  return (
    context.kind === "requestBody" || context.kind === "componentsRequestBody"
  );
}

/**
 * VisitorContextがResponseContextかどうかを判定
 */
export function isResponseContext(
  context: VisitorContext,
): context is ResponseContext {
  return context.kind === "response" || context.kind === "componentsResponse";
}

/**
 * RequestBodyContextがPathsRequestBodyContextかどうかを判定
 */
export function isPathsRequestBodyContext(
  context: RequestBodyContext,
): context is PathsRequestBodyContext {
  return context.kind === "requestBody";
}

/**
 * ResponseContextがPathsResponseContextかどうかを判定
 */
export function isPathsResponseContext(
  context: ResponseContext,
): context is PathsResponseContext {
  return context.kind === "response";
}

/**
 * SchemaObjectがArraySchemaObjectかどうかを判定
 *
 * @example
 * if (isArraySchemaObject(schema)) {
 *   // schemaはArraySchemaObject型に絞り込まれる
 *   console.log(schema.items); // OK: itemsプロパティが存在
 * }
 */
export function isArraySchemaObject(
  schema: SchemaObject | ReferenceObject,
): schema is ArraySchemaObject {
  return (
    !isReferenceObject(schema) &&
    typeof schema === "object" &&
    schema !== null &&
    schema.type === "array"
  );
}

/**
 * SchemaObjectがNonArraySchemaObjectかどうかを判定
 */
export function isNonArraySchemaObject(
  schema: SchemaObject | ReferenceObject,
): schema is NonArraySchemaObject {
  return (
    !isReferenceObject(schema) &&
    typeof schema === "object" &&
    schema !== null &&
    typeof schema.type === "string" &&
    schema.type !== "array"
  );
}

/**
 * SchemaObjectがObject型かどうかを判定
 *
 * @example
 * if (isObjectSchemaObject(schema)) {
 *   // schemaはobject型として扱える
 *   console.log(schema.properties); // propertiesがある可能性
 * }
 */
export function isObjectSchemaObject(
  schema: SchemaObject | ReferenceObject,
): schema is NonArraySchemaObject & { type: "object" } {
  return (
    !isReferenceObject(schema) &&
    typeof schema === "object" &&
    schema !== null &&
    schema.type === "object"
  );
}

/**
 * SchemaObjectがEnum定義を持つかどうかを判定
 *
 * @example
 * if (isEnumSchema(schema)) {
 *   // schemaはenum配列を持つ
 *   console.log(schema.enum); // OK: enumプロパティが存在
 * }
 */
export function isEnumSchema(
  schema: SchemaObject | ReferenceObject,
): schema is SchemaObject & { enum: unknown[] } {
  return (
    !isReferenceObject(schema) &&
    typeof schema === "object" &&
    schema !== null &&
    "enum" in schema &&
    Array.isArray(schema.enum) &&
    schema.enum.length > 0
  );
}

/**
 * SchemaObjectがComposition（allOf/oneOf/anyOf）を持つかどうかを判定
 */
export function isCompositionSchema(
  schema: SchemaObject | ReferenceObject,
): schema is SchemaObject &
  (
    | { allOf: (ReferenceObject | SchemaObject)[] }
    | { oneOf: (ReferenceObject | SchemaObject)[] }
    | { anyOf: (ReferenceObject | SchemaObject)[] }
  ) {
  return (
    !isReferenceObject(schema) &&
    typeof schema === "object" &&
    schema !== null &&
    (("allOf" in schema && Array.isArray(schema.allOf)) ||
      ("oneOf" in schema && Array.isArray(schema.oneOf)) ||
      ("anyOf" in schema && Array.isArray(schema.anyOf)))
  );
}

/**
 * SchemaObjectがadditionalPropertiesのみ（Map型）かどうかを判定
 */
export function isMapSchema(
  schema: SchemaObject | ReferenceObject,
): schema is SchemaObject & {
  additionalProperties: boolean | ReferenceObject | SchemaObject;
} {
  return (
    !isReferenceObject(schema) &&
    typeof schema === "object" &&
    schema !== null &&
    "additionalProperties" in schema &&
    schema.additionalProperties !== undefined &&
    schema.additionalProperties !== false &&
    (!("properties" in schema) ||
      !schema.properties ||
      Object.keys(schema.properties).length === 0)
  );
}

/**
 * SchemaObjectがPrimitive型かどうかを判定
 */
export function isPrimitiveSchema(
  schema: SchemaObject | ReferenceObject,
): schema is NonArraySchemaObject & {
  type: "string" | "number" | "integer" | "boolean";
} {
  return (
    !isReferenceObject(schema) &&
    typeof schema === "object" &&
    schema !== null &&
    typeof schema.type === "string" &&
    ["string", "number", "integer", "boolean"].includes(schema.type)
  );
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("Type Guards", () => {
    describe("isReferenceObject", () => {
      it("should identify reference object", () => {
        expect(isReferenceObject({ $ref: "#/components/schemas/User" })).toBe(
          true,
        );
        expect(isReferenceObject({ type: "string" })).toBe(false);
        expect(isReferenceObject(null)).toBe(false);
        expect(isReferenceObject(undefined)).toBe(false);
        expect(isReferenceObject("")).toBe(false);
        expect(isReferenceObject(123)).toBe(false);
        expect(isReferenceObject([])).toBe(false);
      });

      it("should handle edge cases", () => {
        expect(isReferenceObject({ $ref: "" })).toBe(true); // 空文字列でも$refがあればtrue
        expect(isReferenceObject({ $ref: null })).toBe(true); // nullでも$refキーがあればtrue
        expect(isReferenceObject({ ref: "#/components/schemas/User" })).toBe(
          false,
        ); // $なしはfalse
      });
    });

    describe("isIRAllOfModel", () => {
      it("should identify allOf model", () => {
        const allOfModel: IRModel = {
          kind: "allOf",
          name: "Extended",
          referencePath: "#/components/schemas/Extended",
          schemas: [],
        };
        expect(isIRAllOfModel(allOfModel)).toBe(true);
      });

      it("should return false for other model types", () => {
        const objectModel: IRModel = {
          kind: "object",
          name: "User",
          referencePath: "#/components/schemas/User",
          properties: [],
        };
        expect(isIRAllOfModel(objectModel)).toBe(false);

        const enumModel: IRModel = {
          kind: "enum",
          name: "Status",
          referencePath: "#/components/schemas/Status",
          type: "string",
          values: [],
        };
        expect(isIRAllOfModel(enumModel)).toBe(false);
      });
    });

    describe("isCompositionType", () => {
      it("should identify composition types", () => {
        expect(isCompositionType("allOf")).toBe(true);
        expect(isCompositionType("oneOf")).toBe(true);
        expect(isCompositionType("anyOf")).toBe(true);
      });

      it("should return false for non-composition types", () => {
        expect(isCompositionType("object")).toBe(false);
        expect(isCompositionType("array")).toBe(false);
        expect(isCompositionType("string")).toBe(false);
        expect(isCompositionType("")).toBe(false);
      });
    });

    describe("isCompositionContext", () => {
      it("should identify composition contexts", () => {
        const allOfContext: VisitorContext = {
          kind: "allOf",
          documentPath: ["components", "schemas", "Extended", "allOf", "0"],
          rootSegment: "components",
        };
        expect(isCompositionContext(allOfContext)).toBe(true);

        const oneOfContext: VisitorContext = {
          kind: "oneOf",
          documentPath: ["components", "schemas", "Pet", "oneOf", "0"],
          rootSegment: "components",
        };
        expect(isCompositionContext(oneOfContext)).toBe(true);

        const anyOfContext: VisitorContext = {
          kind: "anyOf",
          documentPath: ["components", "schemas", "Item", "anyOf", "0"],
          rootSegment: "components",
        };
        expect(isCompositionContext(anyOfContext)).toBe(true);
      });

      it("should return false for non-composition contexts", () => {
        const baseContext: VisitorContext = {
          documentPath: ["components", "schemas", "User"],
          rootSegment: "components",
        };
        expect(isCompositionContext(baseContext)).toBe(false);

        const schemaContext: VisitorContext = {
          kind: "schema",
          documentPath: ["components", "schemas", "User"],
          rootSegment: "components",
        };
        expect(isCompositionContext(schemaContext)).toBe(false);
      });
    });

    describe("isAdditionalPropertiesContext", () => {
      it("should identify additionalProperties contexts", () => {
        const context: AdditionalPropertiesContext = {
          kind: "additionalProperties",
          documentPath: [
            "components",
            "schemas",
            "Test",
            "additionalProperties",
          ],
          rootSegment: "components",
          parentSchemaName: "Test",
        };
        expect(isAdditionalPropertiesContext(context)).toBe(true);
      });

      it("should return false for non-additionalProperties contexts", () => {
        const baseContext: VisitorContext = {
          documentPath: ["components", "schemas", "User"],
          rootSegment: "components",
        };
        expect(isAdditionalPropertiesContext(baseContext)).toBe(false);
      });
    });

    describe("isParameterContext", () => {
      it("should identify parameter contexts", () => {
        const parameterContext: ParameterContext = {
          kind: "parameter",
          documentPath: ["paths", "/users", "get", "parameters"],
          rootSegment: "paths",
          parameterName: "limit",
          in: "query",
        };
        expect(isParameterContext(parameterContext)).toBe(true);
      });

      it("should return false for non-parameter contexts", () => {
        const baseContext: VisitorContext = {
          documentPath: ["components", "schemas", "User"],
          rootSegment: "components",
        };
        expect(isParameterContext(baseContext)).toBe(false);
      });
    });

    describe("isRequestBodyContext", () => {
      it("should identify request body contexts", () => {
        const requestBodyContext: RequestBodyContext = {
          kind: "requestBody",
          documentPath: ["paths", "/users", "post", "requestBody"],
          rootSegment: "paths",
          contentType: "application/json",
          schemaPath: ["content", "application/json", "schema"],
        };
        expect(isRequestBodyContext(requestBodyContext)).toBe(true);
      });

      it("should return false for non-request-body contexts", () => {
        const baseContext: VisitorContext = {
          documentPath: ["components", "schemas", "User"],
          rootSegment: "components",
        };
        expect(isRequestBodyContext(baseContext)).toBe(false);
      });
    });

    describe("isResponseContext", () => {
      it("should identify response contexts", () => {
        const responseContext: ResponseContext = {
          kind: "response",
          documentPath: ["paths", "/users", "get", "responses", "200"],
          rootSegment: "paths",
          contentType: "application/json",
          schemaPath: ["content", "application/json", "schema"],
        };
        expect(isResponseContext(responseContext)).toBe(true);
      });

      it("should return false for non-response contexts", () => {
        const baseContext: VisitorContext = {
          documentPath: ["components", "schemas", "User"],
          rootSegment: "components",
        };
        expect(isResponseContext(baseContext)).toBe(false);
      });
    });

    describe("Schema Type Guards", () => {
      describe("isArraySchemaObject", () => {
        it("should identify array schema", () => {
          const arraySchema: SchemaObject = {
            type: "array",
            items: { type: "string" },
          };
          expect(isArraySchemaObject(arraySchema)).toBe(true);
        });

        it("should return false for non-array schema", () => {
          const objectSchema: SchemaObject = {
            type: "object",
          };
          expect(isArraySchemaObject(objectSchema)).toBe(false);
        });

        it("should return false for reference", () => {
          const ref: ReferenceObject = {
            $ref: "#/components/schemas/User",
          };
          expect(isArraySchemaObject(ref)).toBe(false);
        });

        it("should return false for null", () => {
          expect(isArraySchemaObject(null as unknown as SchemaObject)).toBe(
            false,
          );
        });
      });

      describe("isNonArraySchemaObject", () => {
        it("should identify non-array schema", () => {
          const objectSchema: SchemaObject = {
            type: "object",
          };
          expect(isNonArraySchemaObject(objectSchema)).toBe(true);
        });

        it("should return false for array schema", () => {
          const arraySchema: SchemaObject = {
            type: "array",
            items: { type: "string" },
          };
          expect(isNonArraySchemaObject(arraySchema)).toBe(false);
        });

        it("should return false when type is array (mixed schema)", () => {
          const mixedSchema = {
            type: ["string", "null"],
          };
          expect(isNonArraySchemaObject(mixedSchema as SchemaObject)).toBe(
            false,
          );
        });

        it("should return false for schema without type", () => {
          const noTypeSchema: SchemaObject = {
            properties: { id: { type: "string" } },
          };
          expect(isNonArraySchemaObject(noTypeSchema)).toBe(false);
        });

        it("should return false for null", () => {
          expect(isNonArraySchemaObject(null as unknown as SchemaObject)).toBe(
            false,
          );
        });
      });

      describe("isObjectSchemaObject", () => {
        it("should identify object schema", () => {
          const objectSchema: SchemaObject = {
            type: "object",
            properties: {
              id: { type: "string" },
            },
          };
          expect(isObjectSchemaObject(objectSchema)).toBe(true);
        });

        it("should return false for array schema", () => {
          const arraySchema: SchemaObject = {
            type: "array",
            items: { type: "string" },
          };
          expect(isObjectSchemaObject(arraySchema)).toBe(false);
        });

        it("should return false for null", () => {
          expect(isObjectSchemaObject(null as unknown as SchemaObject)).toBe(
            false,
          );
        });
      });

      describe("isEnumSchema", () => {
        it("should identify enum schema", () => {
          const enumSchema: SchemaObject = {
            type: "string",
            enum: ["a", "b", "c"],
          };
          expect(isEnumSchema(enumSchema)).toBe(true);
        });

        it("should return false for empty enum", () => {
          const emptyEnum: SchemaObject = {
            type: "string",
            enum: [],
          };
          expect(isEnumSchema(emptyEnum)).toBe(false);
        });

        it("should return false for schema without enum", () => {
          const stringSchema: SchemaObject = {
            type: "string",
          };
          expect(isEnumSchema(stringSchema)).toBe(false);
        });

        it("should return false for null", () => {
          expect(isEnumSchema(null as unknown as SchemaObject)).toBe(false);
        });
      });

      describe("isCompositionSchema", () => {
        it("should identify allOf schema", () => {
          const allOfSchema: SchemaObject = {
            allOf: [{ type: "object" }, { type: "object" }],
          };
          expect(isCompositionSchema(allOfSchema)).toBe(true);
        });

        it("should identify oneOf schema", () => {
          const oneOfSchema: SchemaObject = {
            oneOf: [{ type: "string" }, { type: "number" }],
          };
          expect(isCompositionSchema(oneOfSchema)).toBe(true);
        });

        it("should identify anyOf schema", () => {
          const anyOfSchema: SchemaObject = {
            anyOf: [{ type: "string" }, { type: "number" }],
          };
          expect(isCompositionSchema(anyOfSchema)).toBe(true);
        });

        it("should return false for non-composition schema", () => {
          const objectSchema: SchemaObject = {
            type: "object",
          };
          expect(isCompositionSchema(objectSchema)).toBe(false);
        });

        it("should return false when allOf is not an array", () => {
          const invalidSchema = {
            allOf: null,
          };
          expect(
            isCompositionSchema(invalidSchema as unknown as SchemaObject),
          ).toBe(false);
        });

        it("should return false when oneOf is not an array", () => {
          const invalidSchema = {
            oneOf: {},
          };
          expect(
            isCompositionSchema(invalidSchema as unknown as SchemaObject),
          ).toBe(false);
        });

        it("should return false when anyOf is not an array", () => {
          const invalidSchema = {
            anyOf: "invalid",
          };
          expect(
            isCompositionSchema(invalidSchema as unknown as SchemaObject),
          ).toBe(false);
        });

        it("should return false for null", () => {
          expect(isCompositionSchema(null as unknown as SchemaObject)).toBe(
            false,
          );
        });
      });

      describe("isMapSchema", () => {
        it("should identify map schema with additionalProperties", () => {
          const mapSchema: SchemaObject = {
            type: "object",
            additionalProperties: { type: "string" },
          };
          expect(isMapSchema(mapSchema)).toBe(true);
        });

        it("should return false when schema has properties", () => {
          const objectSchema: SchemaObject = {
            type: "object",
            properties: { id: { type: "string" } },
            additionalProperties: { type: "string" },
          };
          expect(isMapSchema(objectSchema)).toBe(false);
        });

        it("should return false when additionalProperties is undefined", () => {
          const objectSchema: SchemaObject = {
            type: "object",
          };
          expect(isMapSchema(objectSchema)).toBe(false);
        });

        it("should return false when additionalProperties is false", () => {
          const strictSchema: SchemaObject = {
            type: "object",
            additionalProperties: false,
          };
          expect(isMapSchema(strictSchema)).toBe(false);
        });

        it("should identify map schema with additionalProperties: true", () => {
          const mapSchema: SchemaObject = {
            type: "object",
            additionalProperties: true,
          };
          expect(isMapSchema(mapSchema)).toBe(true);
        });

        it("should return false for null", () => {
          expect(isMapSchema(null as unknown as SchemaObject)).toBe(false);
        });
      });

      describe("isPrimitiveSchema", () => {
        it("should identify primitive types", () => {
          expect(isPrimitiveSchema({ type: "string" })).toBe(true);
          expect(isPrimitiveSchema({ type: "number" })).toBe(true);
          expect(isPrimitiveSchema({ type: "integer" })).toBe(true);
          expect(isPrimitiveSchema({ type: "boolean" })).toBe(true);
        });

        it("should return false for non-primitive types", () => {
          expect(isPrimitiveSchema({ type: "object" })).toBe(false);
          expect(
            isPrimitiveSchema({ type: "array", items: { type: "string" } }),
          ).toBe(false);
        });

        it("should return false for null", () => {
          expect(isPrimitiveSchema(null as unknown as SchemaObject)).toBe(
            false,
          );
        });
      });
    });
  });
}
