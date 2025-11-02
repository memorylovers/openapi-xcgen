/**
 * Schema Dispatcher - v2 Transformer Architecture
 *
 * SchemaObjectの型を判定し、適切なtransformer/traverserに処理を委譲します。
 * Phase 2では基本的な型（enum, primitive, array, map）のみ対応。
 * Phase 3-4で composition型とobject型を追加予定。
 */

import type {
  ReferenceObject,
  SchemaObject,
  SchemaObjectWithNullable,
} from "../../../types";
import { isReferenceObject } from "../../../types";
import type { VisitorContext } from "../../types";
import { transformAllOf } from "../transformers/allof-transformer";
import { transformAnyOf } from "../transformers/anyof-transformer";
import { transformArray } from "../transformers/array-transformer";
import { transformEnum } from "../transformers/enum-transformer";
import { transformMap } from "../transformers/map-transformer";
import { transformObject } from "../transformers/object-transformer";
import { transformOneOf } from "../transformers/oneof-transformer";
import { transformPrimitive } from "../transformers/primitive-transformer";
import { transformRequestBodyObject } from "../transformers/request-body-object-transformer";
import { transformResponseObject } from "../transformers/response-object-transformer";
import { traverseArrayItem } from "../traversers/array-traverser";
import { traverseComposition } from "../traversers/composition-traverser";
import { traverseMapValue } from "../traversers/map-traverser";
import {
  traverseObjectAdditionalProperties,
  traverseObjectProperties,
} from "../traversers/object-traverser";
import type { TransformResult } from "../types";

/**
 * Schema型を判定し、適切な処理に委譲
 *
 * Phase 2実装範囲:
 * - $ref参照 → transformPrimitive
 * - enum → transformEnum
 * - array → traverseArrayItem + transformArray
 * - map（additionalPropertiesのみ） → traverseMapValue + transformMap
 * - primitive → transformPrimitive
 *
 * Phase 3実装範囲:
 * - allOf → traverseComposition + transformAllOf
 * - oneOf → traverseComposition + transformOneOf
 * - anyOf → traverseComposition + transformAnyOf
 *
 * Phase 4実装範囲:
 * - object → traverseObjectProperties + transformObject
 *
 * @param schema - 処理対象のスキーマ
 * @param context - Visitorコンテキスト
 * @returns 処理結果（型と抽出されたmodels）
 */
export function dispatchSchema(
  schema: SchemaObjectWithNullable | ReferenceObject,
  context: VisitorContext,
): TransformResult {
  // $ref参照の場合
  if (isReferenceObject(schema)) {
    return transformPrimitive(schema, context);
  }

  // enum
  if (schema.enum !== undefined) {
    return transformEnum(schema as SchemaObject, context);
  }

  // array
  if (schema.type === "array") {
    const traversalResult = traverseArrayItem(
      schema as SchemaObject & {
        items?: SchemaObjectWithNullable | ReferenceObject;
      },
      context,
      dispatchSchema, // 再帰的に自分自身を渡す
    );
    return transformArray(
      schema as SchemaObject & { items?: SchemaObject | ReferenceObject },
      context,
      traversalResult,
    );
  }

  // map (additionalPropertiesのみ)
  if (
    "additionalProperties" in schema &&
    schema.additionalProperties !== undefined &&
    (!schema.properties || Object.keys(schema.properties).length === 0)
  ) {
    const traversalResult = traverseMapValue(
      schema as SchemaObject,
      context,
      dispatchSchema, // 再帰的に自分自身を渡す
    );
    return transformMap(schema as SchemaObject, context, traversalResult);
  }

  // allOf
  if ("allOf" in schema && schema.allOf) {
    const traversalResult = traverseComposition(
      schema.allOf,
      context,
      dispatchSchema, // 再帰的に自分自身を渡す
      "allOf",
    );
    return transformAllOf(schema as SchemaObject, context, traversalResult);
  }

  // oneOf
  if ("oneOf" in schema && schema.oneOf) {
    const traversalResult = traverseComposition(
      schema.oneOf,
      context,
      dispatchSchema, // 再帰的に自分自身を渡す
      "oneOf",
    );
    return transformOneOf(schema as SchemaObject, context, traversalResult);
  }

  // anyOf
  if ("anyOf" in schema && schema.anyOf) {
    const traversalResult = traverseComposition(
      schema.anyOf,
      context,
      dispatchSchema, // 再帰的に自分自身を渡す
      "anyOf",
    );
    return transformAnyOf(schema as SchemaObject, context, traversalResult);
  }

  // object (properties あり)
  if (schema.type === "object" || (!schema.type && schema.properties)) {
    const propertyTraversalResult = traverseObjectProperties(
      schema as SchemaObject,
      context,
      dispatchSchema, // 再帰的に自分自身を渡す
    );

    // additionalPropertiesの処理（propertiesと共存する場合）
    const additionalResult = traverseObjectAdditionalProperties(
      schema as SchemaObject,
      context,
      dispatchSchema,
    );

    // requestBody文脈の場合、TransformerにIRRequestBodyModel生成を委譲
    if (
      context.kind === "requestBody" ||
      context.kind === "componentsRequestBody"
    ) {
      return transformRequestBodyObject(
        schema as SchemaObject,
        context,
        propertyTraversalResult,
        additionalResult,
      );
    }

    // response文脈の場合、TransformerにIRResponseModel生成を委譲
    if (context.kind === "response" || context.kind === "componentsResponse") {
      return transformResponseObject(
        schema as SchemaObject,
        context,
        propertyTraversalResult,
        additionalResult,
      );
    }

    // 通常のobjectモデル
    return transformObject(
      schema as SchemaObject,
      context,
      propertyTraversalResult,
      additionalResult,
    );
  }

  // primitive
  return transformPrimitive(schema, context);
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("dispatchSchema (Phase 2)", () => {
    it("should dispatch $ref to transformPrimitive", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const schema = { $ref: "#/components/schemas/User" } as any;
      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "components",
      };

      const result = dispatchSchema(schema, context);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/User",
      });
      expect(result.models).toEqual([]);
    });

    it("should dispatch enum to transformEnum", () => {
      const schema: SchemaObject = {
        type: "string",
        enum: ["pending", "approved", "rejected"],
        description: "Status",
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Status"],
        rootSegment: "components",
      };

      const result = dispatchSchema(schema, context);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/Status",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0].kind).toBe("enum");
    });

    it("should dispatch primitive to transformPrimitive", () => {
      const schema: SchemaObject = {
        type: "string",
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Name"],
        rootSegment: "components",
      };

      const result = dispatchSchema(schema, context);

      expect(result.type).toBe("string");
      expect(result.models).toEqual([]);
    });

    it("should dispatch array with recursive traversal", () => {
      const schema: SchemaObject = {
        type: "array",
        items: { type: "string" },
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Items"],
        rootSegment: "components",
      };

      const result = dispatchSchema(schema, context);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/Items",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0].kind).toBe("array");
    });

    it("should dispatch map (additionalProperties only)", () => {
      const schema: SchemaObject = {
        type: "object",
        additionalProperties: { type: "string" },
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "StringMap"],
        rootSegment: "components",
      };

      const result = dispatchSchema(schema, context);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/StringMap",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0].kind).toBe("map");
    });

    it("should dispatch allOf with recursive traversal", () => {
      const schema = {
        allOf: [
          { $ref: "#/components/schemas/Base" },
          { type: "object", properties: { extra: { type: "string" } } },
        ],
        description: "Extended model",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Extended"],
        rootSegment: "components",
      };

      const result = dispatchSchema(schema, context);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/Extended",
      });
      // allOf + nested object model
      expect(result.models.length).toBeGreaterThanOrEqual(1);
      expect(result.models[0].kind).toBe("allOf");
    });

    it("should dispatch oneOf with recursive traversal", () => {
      const schema = {
        oneOf: [
          { $ref: "#/components/schemas/Success" },
          { $ref: "#/components/schemas/Error" },
        ],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Result"],
        rootSegment: "components",
      };

      const result = dispatchSchema(schema, context);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/Result",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0].kind).toBe("union");
    });

    it("should dispatch anyOf with recursive traversal", () => {
      const schema = {
        anyOf: [{ type: "string" }, { type: "number" }],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Value"],
        rootSegment: "components",
      };

      const result = dispatchSchema(schema, context);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/Value",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0].kind).toBe("anyOf");
    });

    it("should dispatch object with properties", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
        },
        required: ["id"],
        description: "User object",
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "User"],
        rootSegment: "components",
      };

      const result = dispatchSchema(schema, context);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/User",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0].kind).toBe("object");
      if (result.models[0].kind === "object") {
        expect(result.models[0].properties).toHaveLength(2);
      }
    });

    it("should dispatch object with additionalProperties", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        additionalProperties: { type: "string" },
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "FlexibleObject"],
        rootSegment: "components",
      };

      const result = dispatchSchema(schema, context);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/FlexibleObject",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0].kind).toBe("object");
      expect(result.models[0]).toHaveProperty("additionalProperties");
    });

    it("should dispatch object without type but with properties", () => {
      const schema = {
        properties: {
          value: { type: "string" as const },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "ImplicitObject"],
        rootSegment: "components",
      };

      const result = dispatchSchema(schema, context);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/ImplicitObject",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0].kind).toBe("object");
    });

    it("should dispatch object in requestBody context to IRRequestBodyModel", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
        },
        description: "User data",
      };
      const context: VisitorContext = {
        kind: "requestBody",
        documentPath: [
          "paths",
          "/users",
          "post",
          "requestBody",
          "content",
          "application/json",
          "schema",
        ],
        rootSegment: "paths",
      };

      const result = dispatchSchema(schema, context);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/paths/::users/post/requestBody/content/application::json/schema",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0].kind).toBe("requestBody");
      if (result.models[0].kind === "requestBody") {
        expect(result.models[0].properties).toHaveLength(2);
        expect(result.models[0].description).toBe("User data");
      }
    });

    it("should dispatch object in componentsRequestBody context to IRRequestBodyModel", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          data: { type: "string" },
        },
      };
      const context: VisitorContext = {
        kind: "componentsRequestBody",
        documentPath: [
          "components",
          "requestBodies",
          "UserInput",
          "content",
          "application/json",
          "schema",
        ],
        rootSegment: "components",
      };

      const result = dispatchSchema(schema, context);

      expect(result.models).toHaveLength(1);
      expect(result.models[0].kind).toBe("requestBody");
    });

    it("should dispatch object in response context to IRResponseModel", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          result: { type: "string" },
          count: { type: "integer" },
        },
        description: "Success response",
      };
      const context: VisitorContext = {
        kind: "response",
        documentPath: [
          "paths",
          "/users",
          "get",
          "responses",
          "200",
          "content",
          "application/json",
          "schema",
        ],
        rootSegment: "paths",
      };

      const result = dispatchSchema(schema, context);

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/paths/::users/get/responses/200/content/application::json/schema",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0].kind).toBe("response");
      if (result.models[0].kind === "response") {
        expect(result.models[0].properties).toHaveLength(2);
        expect(result.models[0].statusCode).toBe("200");
        expect(result.models[0].description).toBe("Success response");
      }
    });

    it("should dispatch object in componentsResponse context to IRResponseModel", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      };
      const context: VisitorContext = {
        kind: "componentsResponse",
        documentPath: [
          "components",
          "responses",
          "ErrorResponse",
          "content",
          "application/json",
          "schema",
        ],
        rootSegment: "components",
      };

      const result = dispatchSchema(schema, context);

      expect(result.models).toHaveLength(1);
      expect(result.models[0].kind).toBe("response");
      // components配下のresponseの場合、statusCodeはdocumentPathから取得できないため
      // responsesIndexが見つからず、documentPath[responsesIndex + 1]はundefinedになるが
      // これは想定された動作（実際にはcomponentsの場合は使われない）
    });

    it("should handle requestBody object with additionalProperties", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        additionalProperties: { type: "string" },
      };
      const context: VisitorContext = {
        kind: "requestBody",
        documentPath: [
          "paths",
          "/data",
          "post",
          "requestBody",
          "content",
          "application/json",
          "schema",
        ],
        rootSegment: "paths",
      };

      const result = dispatchSchema(schema, context);

      expect(result.models[0].kind).toBe("requestBody");
      if (result.models[0].kind === "requestBody") {
        expect(result.models[0].additionalProperties).toBe("string");
      }
    });

    it("should handle response object with additionalProperties", () => {
      const schema: SchemaObject = {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        additionalProperties: { type: "number" },
      };
      const context: VisitorContext = {
        kind: "response",
        documentPath: [
          "paths",
          "/data",
          "get",
          "responses",
          "200",
          "content",
          "application/json",
          "schema",
        ],
        rootSegment: "paths",
      };

      const result = dispatchSchema(schema, context);

      expect(result.models[0].kind).toBe("response");
      if (result.models[0].kind === "response") {
        // number型はIR変換で"double"になる
        expect(result.models[0].additionalProperties).toBe("double");
      }
    });
  });
}
