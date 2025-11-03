/**
 * Enum Transformer - v2 Transformer Architecture
 *
 * Enum型スキーマをIREnumModelに変換します。
 * トラバーサルは不要（リーフノード）のため、純粋な変換処理のみを行います。
 *
 * @bnf-target <schema-object> with enum array
 * @bnf-ref _docs/900_openapi_v3.1_BNF_spec.md:325
 */

import { consola } from "consola";
import type { IREnumModel, IREnumValue, SchemaObject } from "../../../types";
import {
  buildReferencePath,
  extractExtensions,
  generateEnumName,
  getModelName,
  toIRScalarType,
} from "../../helpers";
import type { VisitorContext } from "../../types";
import { createErrorResult } from "../errors";
import type { TransformResult } from "../types";

/**
 * Enum型スキーマをIREnumModelに変換
 *
 * @bnf <schema-object> - enum配列を持つスキーマオブジェクト
 * @bnf-ref _docs/900_openapi_v3.1_BNF_spec.md:325
 * @bnf-fields
 *   - `enum` (line 325): 列挙値の配列
 *   - `type` (line 309): <type-value> - IRScalarType ("string" | "number" | "integer" | "boolean")
 *   - `description` (line 335): Enumの説明
 *
 * @param schema - OpenAPI SchemaObject
 * @param context - Visitor context (Phase 1では既存のVisitorContextを使用)
 * @returns 変換結果（type: ref型, models: [IREnumModel]）
 *
 * @example OpenAPI YAML
 * ```yaml
 * # 文字列型のEnum
 * Status:
 *   type: string
 *   enum: ["pending", "approved", "rejected"]
 *   description: "処理状態"
 *
 * # 数値型のEnum
 * Priority:
 *   type: integer
 *   enum: [1, 2, 3]
 *   description: "優先度"
 * ```
 *
 * @example Usage
 * ```typescript
 * const result = transformEnum(schema, { documentPath: ["components", "schemas", "Status"] });
 * // result.type.kind === "ref"
 * // result.models[0].kind === "enum"
 * ```
 */
export function transformEnum(
  schema: SchemaObject,
  context: VisitorContext,
): TransformResult {
  // コンテキストからモデル名を取得
  const name = getModelName(context);

  // 名前の妥当性チェック
  if (!name.trim()) {
    return createErrorResult(
      "Invalid enum name: empty or whitespace only",
      "INVALID_ENUM_NAME",
      { context },
    );
  }

  // enum配列のチェック
  if (!schema.enum) {
    return createErrorResult(
      `Missing enum array for ${name}`,
      "MISSING_ENUM_ARRAY",
      { name, context },
    );
  }

  // enum配列が配列でない場合
  if (!Array.isArray(schema.enum)) {
    return createErrorResult(
      `Invalid enum type for ${name}: not an array`,
      "INVALID_ENUM_TYPE",
      { name, context },
    );
  }

  // enum配列が空の場合
  if (schema.enum.length === 0) {
    return createErrorResult(
      `Empty enum array for ${name}`,
      "EMPTY_ENUM_ARRAY",
      { name, context },
    );
  }

  // NOTE: TypeSpecは常にtypeを明示的に出力するため、
  // typeが未定義の場合はエラーとして扱う。
  // 手書きOpenAPIで型推論が必要な場合（例: enum: [1,2,3]のみ）は
  // 将来的にinferEnumType()関数を実装して対応する。
  // OpenAPI 3.1ではtypeが配列の場合もあるので、文字列の場合のみ処理
  if (typeof schema.type !== "string") {
    return createErrorResult(
      `Missing or invalid type for enum ${name}: ${schema.type}`,
      "INVALID_ENUM_SCHEMA_TYPE",
      { name, schemaType: schema.type, context },
    );
  }

  const type = toIRScalarType(schema.type);
  if (!type) {
    return createErrorResult(
      `Invalid scalar type for enum ${name}: ${schema.type}`,
      "INVALID_SCALAR_TYPE",
      { name, schemaType: schema.type, context },
    );
  }

  // enum値をIREnumValueに変換
  const values: IREnumValue[] = schema.enum.map((value: unknown) => {
    const enumName = generateEnumName(value);
    return { value: value as string | number, name: enumName };
  });

  // 拡張フィールドを抽出
  const extensions = extractExtensions(schema);

  // IREnumModelを作成
  const referencePath = buildReferencePath(context.documentPath);
  const enumModel: IREnumModel = {
    kind: "enum",
    name,
    referencePath,
    type,
    values,
    ...(schema.description && { description: schema.description }),
    ...(extensions && { extensions }),
  };

  // 統一インターフェースで返す
  return {
    type: { kind: "ref", name: referencePath },
    models: [enumModel],
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("transformEnum", () => {
    it("should detect and convert string enum from schema", () => {
      const schema: SchemaObject = {
        type: "string",
        enum: ["pending", "approved", "rejected"],
        description: "Status of the item",
      };

      const result = transformEnum(schema, {
        documentPath: ["components", "schemas", "Status"],
        rootSegment: "components",
      });

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/Status",
      });
      expect(result.models).toEqual([
        {
          kind: "enum",
          name: "Status",
          referencePath: "#/components/schemas/Status",
          type: "string",
          description: "Status of the item",
          values: [
            { value: "pending", name: "PENDING" },
            { value: "approved", name: "APPROVED" },
            { value: "rejected", name: "REJECTED" },
          ],
        },
      ]);
    });

    it("should detect and convert integer enum from schema", () => {
      const schema: SchemaObject = {
        type: "integer",
        enum: [1, 2, 3],
        description: "Priority level",
      };

      const result = transformEnum(schema, {
        documentPath: ["components", "schemas", "Priority"],
        rootSegment: "components",
      });

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/Priority",
      });
      expect(result.models).toEqual([
        {
          kind: "enum",
          name: "Priority",
          referencePath: "#/components/schemas/Priority",
          type: "int", // integerはIRScalarTypeのintに変換される
          description: "Priority level",
          values: [
            { value: 1, name: "VALUE_1" },
            { value: 2, name: "VALUE_2" },
            { value: 3, name: "VALUE_3" },
          ],
        },
      ]);
    });

    it("should handle string enum with special characters", () => {
      const schema: SchemaObject = {
        type: "string",
        enum: ["in-progress", "on_hold", "completed!", "new/pending"],
      };

      const result = transformEnum(schema, {
        documentPath: ["components", "schemas", "TaskStatus"],
        rootSegment: "components",
      });

      expect(result.type).toEqual({
        kind: "ref",
        name: "#/components/schemas/TaskStatus",
      });
      expect(result.models).toEqual([
        {
          kind: "enum",
          name: "TaskStatus",
          referencePath: "#/components/schemas/TaskStatus",
          type: "string",
          values: [
            { value: "in-progress", name: "IN_PROGRESS" },
            { value: "on_hold", name: "ON_HOLD" },
            { value: "completed!", name: "COMPLETED_" },
            { value: "new/pending", name: "NEW_PENDING" },
          ],
        },
      ]);
    });

    it("should return error result for schema without enum array", () => {
      const schema: SchemaObject = {
        type: "string",
        minLength: 3,
        maxLength: 50,
      };

      const result = transformEnum(schema, {
        documentPath: ["components", "schemas", "Status"],
        rootSegment: "components",
      });

      expect(result.type).toBeNull();
      expect(result.models).toEqual([]);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe("MISSING_ENUM_ARRAY");
    });

    it("should warn and return error result for invalid enum type", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      // enum配列が空の場合
      const emptySchema: SchemaObject = {
        type: "string",
        enum: [],
      };

      const emptyResult = transformEnum(emptySchema, {
        documentPath: ["components", "schemas", "Status"],
        rootSegment: "components",
      });
      expect(emptyResult.type).toBeNull();
      expect(emptyResult.models).toEqual([]);
      expect(emptyResult.error?.code).toBe("EMPTY_ENUM_ARRAY");

      // enum配列でない場合
      const invalidSchema = {
        type: "string",
        enum: "not-an-array",
      } as unknown as SchemaObject;

      const invalidResult = transformEnum(invalidSchema, {
        documentPath: ["components", "schemas", "Status"],
        rootSegment: "components",
      });
      expect(invalidResult.type).toBeNull();
      expect(invalidResult.models).toEqual([]);
      expect(invalidResult.error?.code).toBe("INVALID_ENUM_TYPE");

      warnSpy.mockRestore();
    });

    it("should return error result when type is missing", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema = {
        enum: [1, 2, 3],
        // typeが未定義
      } as SchemaObject;

      const result = transformEnum(schema, {
        documentPath: ["components", "schemas", "Numbers"],
        rootSegment: "components",
      });

      expect(result.type).toBeNull();
      expect(result.models).toEqual([]);
      expect(result.error?.code).toBe("INVALID_ENUM_SCHEMA_TYPE");

      warnSpy.mockRestore();
    });

    it("should return error result for empty enum name", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObject = {
        type: "string",
        enum: ["a", "b", "c"],
      };

      const result = transformEnum(schema, {
        documentPath: ["components", "schemas", ""],
        rootSegment: "components",
      });

      expect(result.type).toBeNull();
      expect(result.models).toEqual([]);
      expect(result.error?.code).toBe("INVALID_ENUM_NAME");

      warnSpy.mockRestore();
    });

    it("should return error result for whitespace-only enum name", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObject = {
        type: "string",
        enum: ["x", "y", "z"],
      };

      const result = transformEnum(schema, {
        documentPath: ["components", "schemas", "   "],
        rootSegment: "components",
      });

      expect(result.type).toBeNull();
      expect(result.models).toEqual([]);
      expect(result.error?.code).toBe("INVALID_ENUM_NAME");

      warnSpy.mockRestore();
    });
  });
}
