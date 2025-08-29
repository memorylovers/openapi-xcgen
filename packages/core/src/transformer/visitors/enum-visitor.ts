/**
 * Enum visitor - detects and converts enum definitions to IREnum
 *
 * @bnf-target <schema-object> with enum array
 * @bnf-ref _docs/900_openapi_v3.1_BNF_spec.md:325
 */

import { consola } from "consola";
import type { SchemaObject, SchemaObjectWithNullable } from "../../types/index";
import type { IREnum, IREnumValue } from "../../types/ir/index";
import { generateEnumName } from "../helpers/generate-enum-name";
import { toIRScalarType } from "../helpers/to-ir-scalar-type";

// Context for enum visitor
export interface EnumVisitorContext {
  /** Enum名（必須） */
  name: string;
}

/**
 * SchemaObjectからEnum定義を検出してIREnumに変換
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
 * @returns IREnum型の結果、enum配列がない場合はnull
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
 * const result = visitEnum(schema, { name: "Status" });
 * ```
 */
export function visitEnum(
  schema: SchemaObjectWithNullable,
  { name }: EnumVisitorContext,
): IREnum | null {
  // 名前の妥当性チェック
  if (!name.trim()) {
    consola.warn("Invalid enum name: empty or whitespace only");
    return null;
  }

  // enum配列のチェック
  if (!schema.enum) return null;

  // enum配列が配列でない場合
  if (!Array.isArray(schema.enum)) {
    consola.warn(`Invalid enum type for ${name}: not an array`);
    return null;
  }

  // enum配列が空の場合
  if (schema.enum.length === 0) {
    consola.warn(`Empty enum array for ${name}`);
    return null;
  }

  // NOTE: TypeSpecは常にtypeを明示的に出力するため、
  // typeが未定義の場合はエラーとして扱う。
  // 手書きOpenAPIで型推論が必要な場合（例: enum: [1,2,3]のみ）は
  // 将来的にinferEnumType()関数を実装して対応する。
  const type = toIRScalarType(schema.type);
  if (!type) {
    consola.warn(`Missing or invalid type for enum ${name}: ${schema.type}`);
    return null;
  }

  // enum値をIREnumValueに変換
  const values: IREnumValue[] = schema.enum.map((value) => {
    const enumName = generateEnumName(value);
    return { value, name: enumName };
  });

  const result: IREnum = { name, type, values };

  // descriptionがある場合のみ追加
  if (schema.description) {
    result.description = schema.description;
  }

  return result;
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

      const result = visitEnum(schema, { name: "Status" });

      expect(result).toEqual({
        name: "Status",
        type: "string",
        description: "Status of the item",
        values: [
          { value: "pending", name: "PENDING" },
          { value: "approved", name: "APPROVED" },
          { value: "rejected", name: "REJECTED" },
        ],
      });
    });

    it("should detect and convert integer enum from schema", () => {
      const schema: SchemaObject = {
        type: "integer",
        enum: [1, 2, 3],
        description: "Priority level",
      };

      const result = visitEnum(schema, { name: "Priority" });

      expect(result).toEqual({
        name: "Priority",
        type: "integer", // OpenAPIの型をそのまま保持
        description: "Priority level",
        values: [
          { value: 1, name: "VALUE_1" },
          { value: 2, name: "VALUE_2" },
          { value: 3, name: "VALUE_3" },
        ],
      });
    });

    it("should handle string enum with special characters", () => {
      const schema: SchemaObject = {
        type: "string",
        enum: ["in-progress", "on_hold", "completed!", "new/pending"],
      };

      const result = visitEnum(schema, { name: "TaskStatus" });

      expect(result).toEqual({
        name: "TaskStatus",
        type: "string",
        values: [
          { value: "in-progress", name: "IN_PROGRESS" },
          { value: "on_hold", name: "ON_HOLD" },
          { value: "completed!", name: "COMPLETED_" },
          { value: "new/pending", name: "NEW_PENDING" },
        ],
      });
    });

    it("should return null for non-enum schema", () => {
      const schema: SchemaObject = {
        type: "string",
        minLength: 3,
        maxLength: 50,
      };

      const result = visitEnum(schema, { name: "Status" });

      expect(result).toBe(null);
    });

    it("should warn and return null for invalid enum type", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      // enum配列が空の場合
      const emptySchema: SchemaObject = {
        type: "string",
        enum: [],
      };

      const emptyResult = visitEnum(emptySchema, { name: "Status" });
      expect(emptyResult).toBe(null);
      expect(warnSpy).toHaveBeenCalledWith("Empty enum array for Status");

      // enum配列でない場合
      const invalidSchema = {
        type: "string",
        enum: "not-an-array",
      } as unknown as SchemaObject;

      const invalidResult = visitEnum(invalidSchema, { name: "Status" });
      expect(invalidResult).toBe(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid enum type for Status: not an array",
      );

      warnSpy.mockRestore();
    });

    it("should return null when type is missing", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema = {
        enum: [1, 2, 3],
        // typeが未定義
      } as SchemaObject;

      const result = visitEnum(schema, { name: "Numbers" });

      expect(result).toBe(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "Missing or invalid type for enum Numbers: undefined",
      );

      warnSpy.mockRestore();
    });

    it("should return null for empty enum name", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObject = {
        type: "string",
        enum: ["a", "b", "c"],
      };

      const result = visitEnum(schema, { name: "" });

      expect(result).toBe(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid enum name: empty or whitespace only",
      );

      warnSpy.mockRestore();
    });

    it("should return null for whitespace-only enum name", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const schema: SchemaObject = {
        type: "string",
        enum: ["x", "y", "z"],
      };

      const result = visitEnum(schema, { name: "   " });

      expect(result).toBe(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid enum name: empty or whitespace only",
      );

      warnSpy.mockRestore();
    });
  });
}
