/**
 * Schema Dispatcher - v2 Transformer Architecture
 *
 * SchemaObjectの型を判定し、適切なtransformer/traverserに処理を委譲します。
 * Phase 2では基本的な型（enum, primitive, array, map）のみ対応。
 * Phase 3-4で composition型とobject型を追加予定。
 */

import { consola } from "consola";
import type {
  ReferenceObject,
  SchemaObject,
  SchemaObjectWithNullable,
} from "../../../types";
import { isReferenceObject } from "../../../types";
import type { VisitorContext } from "../../types";
import { transformArray } from "../transformers/array-transformer";
import { transformEnum } from "../transformers/enum-transformer";
import { transformMap } from "../transformers/map-transformer";
import { transformPrimitive } from "../transformers/primitive-transformer";
import { traverseArrayItem } from "../traversers/array-traverser";
import { traverseMapValue } from "../traversers/map-traverser";
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
 * Phase 3で追加予定:
 * - allOf/oneOf/anyOf → composition transformer
 *
 * Phase 4で追加予定:
 * - object → object traverser + transformer
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

  // Phase 3で実装予定: allOf/oneOf/anyOf
  if ("allOf" in schema && schema.allOf) {
    consola.warn(
      `allOf is not yet supported in Phase 2: ${context.documentPath.join("/")}`,
    );
    return { type: null, models: [] };
  }
  if ("oneOf" in schema && schema.oneOf) {
    consola.warn(
      `oneOf is not yet supported in Phase 2: ${context.documentPath.join("/")}`,
    );
    return { type: null, models: [] };
  }
  if ("anyOf" in schema && schema.anyOf) {
    consola.warn(
      `anyOf is not yet supported in Phase 2: ${context.documentPath.join("/")}`,
    );
    return { type: null, models: [] };
  }

  // Phase 4で実装予定: object
  if (schema.type === "object" || (!schema.type && schema.properties)) {
    consola.warn(
      `object is not yet supported in Phase 2: ${context.documentPath.join("/")}`,
    );
    return { type: null, models: [] };
  }

  // primitive
  return transformPrimitive(schema, context);
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

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

    it("should warn for unsupported allOf (Phase 3)", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const schema = {
        allOf: [{ type: "object" }],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "Extended"],
        rootSegment: "components",
      };

      const result = dispatchSchema(schema, context);

      expect(result.type).toBeNull();
      expect(result.models).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("allOf is not yet supported"),
      );

      warnSpy.mockRestore();
    });

    it("should warn for unsupported object with properties (Phase 4)", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});
      const schema: SchemaObject = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      };
      const context: VisitorContext = {
        documentPath: ["components", "schemas", "User"],
        rootSegment: "components",
      };

      const result = dispatchSchema(schema, context);

      expect(result.type).toBeNull();
      expect(result.models).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("object is not yet supported"),
      );

      warnSpy.mockRestore();
    });
  });
}
