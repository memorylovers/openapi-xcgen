/**
 * Enum visitor - detects and converts enum definitions to IREnum
 *
 * @bnf-target <schema-object> with enum array
 * @bnf-ref _docs/900_openapi_v3.1_BNF_spec.md:325
 */

import { consola } from "consola";
import type { SchemaObject, SchemaObjectWithNullable } from "../../types/index";
import type { IRModel, IREnumModel, IREnumValue } from "../../types/ir/index";
import type { VisitorContext } from "../types";
import { generateEnumName } from "../helpers/generate-enum-name";
import { toIRScalarType } from "../helpers/to-ir-scalar-type";
import { buildReferencePath } from "../helpers/build-reference-path";

/**
 * Enum visitor結果の型
 */
export interface EnumVisitorResult {
  /** 抽出されたモデル（IREnumModelを含む） */
  models: IRModel[];
}

/**
 * SchemaObjectからEnum定義を検出してIREnumModelに変換
 *
 * @bnf <schema-object> - enum配列を持つスキーマオブジェクト
 * @bnf-ref _docs/900_openapi_v3.1_BNF_spec.md:325
 * @bnf-fields
 *   - `enum` (line 325): 列挙値の配列
 *   - `type` (line 309): <type-value> - IRScalarType ("string" | "number" | "integer" | "boolean")
 *   - `description` (line 335): Enumの説明
 *
 * @param schema - OpenAPI SchemaObject
 * @param context - Visitor context with enum name
 * @returns 統一されたモデル配列、enum配列がない場合は空の配列
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
 * const result = visitEnum(schema, { documentPath: ["components", "schemas", "Status"] });
 * // result.models[0].kind === "enum"
 * ```
 */
export function visitEnum(
  schema: SchemaObjectWithNullable,
  context: VisitorContext,
): EnumVisitorResult {
  // documentPathから名前を抽出（最後の要素がEnum名）
  const name = context.documentPath[context.documentPath.length - 1] || "";

  // 名前の妥当性チェック
  if (!name.trim()) {
    consola.warn("Invalid enum name: empty or whitespace only");
    return { models: [] };
  }

  // enum配列のチェック
  if (!schema.enum) return { models: [] };

  // enum配列が配列でない場合
  if (!Array.isArray(schema.enum)) {
    consola.warn(`Invalid enum type for ${name}: not an array`);
    return { models: [] };
  }

  // enum配列が空の場合
  if (schema.enum.length === 0) {
    consola.warn(`Empty enum array for ${name}`);
    return { models: [] };
  }

  // NOTE: TypeSpecは常にtypeを明示的に出力するため、
  // typeが未定義の場合はエラーとして扱う。
  // 手書きOpenAPIで型推論が必要な場合（例: enum: [1,2,3]のみ）は
  // 将来的にinferEnumType()関数を実装して対応する。
  // OpenAPI 3.1ではtypeが配列の場合もあるので、文字列の場合のみ処理
  if (typeof schema.type !== "string") {
    consola.warn(`Missing or invalid type for enum ${name}: ${schema.type}`);
    return { models: [] };
  }

  const type = toIRScalarType(schema.type);
  if (!type) {
    consola.warn(`Invalid scalar type for enum ${name}: ${schema.type}`);
    return { models: [] };
  }

  // enum値をIREnumValueに変換
  const values: IREnumValue[] = schema.enum.map((value) => {
    const enumName = generateEnumName(value);
    return { value, name: enumName, description: null };
  });

  // IREnumModelを作成
  const enumModel: IREnumModel = {
    kind: "enum",
    name,
    referencePath: buildReferencePath(context.documentPath),
    description: schema.description || null,
    type,
    values,
  };

  return { models: [enumModel] };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitEnum", () => {
    it("should detect and convert string enum from schema", () => {
      const schema: SchemaObject = {
        type: "string",
        enum: ["pending", "approved", "rejected"],
        description: "Status of the item",
      };

      const result = visitEnum(schema, {
        documentPath: ["components", "schemas", "Status"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [
          {
            kind: "enum",
            name: "Status",
            referencePath: "#/components/schemas/Status",
            type: "string",
            description: "Status of the item",
            values: [
              { value: "pending", name: "PENDING", description: null },
              { value: "approved", name: "APPROVED", description: null },
              { value: "rejected", name: "REJECTED", description: null },
            ],
          },
        ],
      });
    });

    it("should detect and convert integer enum from schema", () => {
      const schema: SchemaObject = {
        type: "integer",
        enum: [1, 2, 3],
        description: "Priority level",
      };

      const result = visitEnum(schema, {
        documentPath: ["components", "schemas", "Priority"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [
          {
            kind: "enum",
            name: "Priority",
            referencePath: "#/components/schemas/Priority",
            type: "int", // integerはIRScalarTypeのintに変換される
            description: "Priority level",
            values: [
              { value: 1, name: "VALUE_1", description: null },
              { value: 2, name: "VALUE_2", description: null },
              { value: 3, name: "VALUE_3", description: null },
            ],
          },
        ],
      });
    });

    it("should handle string enum with special characters", () => {
      const schema: SchemaObject = {
        type: "string",
        enum: ["in-progress", "on_hold", "completed!", "new/pending"],
      };

      const result = visitEnum(schema, {
        documentPath: ["components", "schemas", "TaskStatus"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [
          {
            kind: "enum",
            name: "TaskStatus",
            description: null,
            referencePath: "#/components/schemas/TaskStatus",
            type: "string",
            values: [
              { value: "in-progress", name: "IN_PROGRESS", description: null },
              { value: "on_hold", name: "ON_HOLD", description: null },
              { value: "completed!", name: "COMPLETED_", description: null },
              { value: "new/pending", name: "NEW_PENDING", description: null },
            ],
          },
        ],
      });
    });

    it("should return empty models array for non-enum schema", () => {
      const schema: SchemaObject = {
        type: "string",
        minLength: 3,
        maxLength: 50,
      };

      const result = visitEnum(schema, {
        documentPath: ["components", "schemas", "Status"],
        rootSegment: "components",
      });

      expect(result).toEqual({ models: [] });
    });

    it("should warn and return empty models array for invalid enum type", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      // enum配列が空の場合
      const emptySchema: SchemaObject = {
        type: "string",
        enum: [],
      };

      const emptyResult = visitEnum(emptySchema, {
        documentPath: ["components", "schemas", "Status"],
        rootSegment: "components",
      });
      expect(emptyResult).toEqual({ models: [] });
      expect(warnSpy).toHaveBeenCalledWith("Empty enum array for Status");

      // enum配列でない場合
      const invalidSchema = {
        type: "string",
        enum: "not-an-array",
      } as unknown as SchemaObject;

      const invalidResult = visitEnum(invalidSchema, {
        documentPath: ["components", "schemas", "Status"],
        rootSegment: "components",
      });
      expect(invalidResult).toEqual({ models: [] });
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid enum type for Status: not an array",
      );

      warnSpy.mockRestore();
    });

    it("should return empty models array when type is missing", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema = {
        enum: [1, 2, 3],
        // typeが未定義
      } as SchemaObject;

      const result = visitEnum(schema, {
        documentPath: ["components", "schemas", "Numbers"],
        rootSegment: "components",
      });

      expect(result).toEqual({ models: [] });
      expect(warnSpy).toHaveBeenCalledWith(
        "Missing or invalid type for enum Numbers: undefined",
      );

      warnSpy.mockRestore();
    });

    it("should return empty models array for empty enum name", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObject = {
        type: "string",
        enum: ["a", "b", "c"],
      };

      const result = visitEnum(schema, {
        documentPath: ["components", "schemas", ""],
        rootSegment: "components",
      });

      expect(result).toEqual({ models: [] });
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid enum name: empty or whitespace only",
      );

      warnSpy.mockRestore();
    });

    it("should return empty models array for whitespace-only enum name", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObject = {
        type: "string",
        enum: ["x", "y", "z"],
      };

      const result = visitEnum(schema, {
        documentPath: ["components", "schemas", "   "],
        rootSegment: "components",
      });

      expect(result).toEqual({ models: [] });
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid enum name: empty or whitespace only",
      );

      warnSpy.mockRestore();
    });
  });
}
