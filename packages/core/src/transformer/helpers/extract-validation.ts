import type { SchemaObject } from "../../types/index";
import type { IRValidation } from "../../types/ir/index";

/**
 * SchemaObjectからバリデーション情報を抽出
 * @param schema - OpenAPI SchemaObject
 * @returns バリデーション情報、バリデーションがない場合はnull
 *
 * @example OpenAPI YAML
 * ```yaml
 * # 文字列バリデーション
 * username:
 *   type: string
 *   minLength: 3
 *   maxLength: 20
 *   pattern: "^[a-zA-Z0-9_]+$"
 *
 * # 数値バリデーション
 * age:
 *   type: integer
 *   minimum: 0
 *   maximum: 150
 *   exclusiveMinimum: false
 *
 * # 配列バリデーション
 * tags:
 *   type: array
 *   minItems: 1
 *   maxItems: 10
 *   uniqueItems: true
 *
 * # オブジェクトバリデーション
 * metadata:
 *   type: object
 *   minProperties: 1
 *   maxProperties: 50
 * ```
 */
export function extractValidation(schema: SchemaObject): IRValidation | null {
  const validation: IRValidation = {};

  // 文字列バリデーション
  if (schema.minLength !== undefined) {
    validation.minLength = schema.minLength;
  }
  if (schema.maxLength !== undefined) {
    validation.maxLength = schema.maxLength;
  }
  if (schema.pattern !== undefined) {
    validation.pattern = schema.pattern;
  }

  // 数値バリデーション
  if (schema.minimum !== undefined) {
    validation.minimum = schema.minimum;
  }
  if (schema.maximum !== undefined) {
    validation.maximum = schema.maximum;
  }
  if (schema.exclusiveMinimum !== undefined) {
    validation.exclusiveMinimum = schema.exclusiveMinimum as boolean;
  }
  if (schema.exclusiveMaximum !== undefined) {
    validation.exclusiveMaximum = schema.exclusiveMaximum as boolean;
  }

  // 配列バリデーション
  if (schema.minItems !== undefined) {
    validation.minItems = schema.minItems;
  }
  if (schema.maxItems !== undefined) {
    validation.maxItems = schema.maxItems;
  }
  if (schema.uniqueItems !== undefined) {
    validation.uniqueItems = schema.uniqueItems;
  }

  // オブジェクトバリデーション
  if (schema.minProperties !== undefined) {
    validation.minProperties = schema.minProperties;
  }
  if (schema.maxProperties !== undefined) {
    validation.maxProperties = schema.maxProperties;
  }

  // 列挙値
  if (schema.enum !== undefined && Array.isArray(schema.enum)) {
    validation.enum = schema.enum;
  }

  // フォーマット（バリデーション用のみ）
  // date、date-time、binary、byteはスカラー型として処理されるため除外
  if (
    schema.format !== undefined &&
    !["date", "date-time", "binary", "byte"].includes(schema.format)
  ) {
    validation.format = schema.format;
  }

  // バリデーションが空の場合はnullを返す
  return Object.keys(validation).length > 0 ? validation : null;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("extractValidation", () => {
    it("should extract string validation", () => {
      const schema: SchemaObject = {
        type: "string",
        minLength: 3,
        maxLength: 50,
        pattern: "^[a-zA-Z]+$",
      };

      const result = extractValidation(schema);

      expect(result).toEqual({
        minLength: 3,
        maxLength: 50,
        pattern: "^[a-zA-Z]+$",
      });
    });

    it("should extract number validation", () => {
      const schema: SchemaObject = {
        type: "number",
        minimum: 0,
        maximum: 100,
        exclusiveMinimum: true,
        exclusiveMaximum: false,
      };

      const result = extractValidation(schema);

      expect(result).toEqual({
        minimum: 0,
        maximum: 100,
        exclusiveMinimum: true,
        exclusiveMaximum: false,
      });
    });

    it("should extract integer validation", () => {
      const schema: SchemaObject = {
        type: "integer",
        minimum: 1,
        maximum: 10,
      };

      const result = extractValidation(schema);

      expect(result).toEqual({
        minimum: 1,
        maximum: 10,
      });
    });

    it("should extract array validation", () => {
      const schema: SchemaObject = {
        type: "array",
        minItems: 1,
        maxItems: 10,
        uniqueItems: true,
        items: { type: "string" },
      };

      const result = extractValidation(schema);

      expect(result).toEqual({
        minItems: 1,
        maxItems: 10,
        uniqueItems: true,
      });
    });

    it("should extract object validation", () => {
      const schema: SchemaObject = {
        type: "object",
        minProperties: 2,
        maxProperties: 10,
      };

      const result = extractValidation(schema);

      expect(result).toEqual({
        minProperties: 2,
        maxProperties: 10,
      });
    });

    it("should extract enum validation", () => {
      const schema: SchemaObject = {
        type: "string",
        enum: ["pending", "approved", "rejected"],
      };

      const result = extractValidation(schema);

      expect(result).toEqual({
        enum: ["pending", "approved", "rejected"],
      });
    });

    it("should extract mixed validation", () => {
      const schema: SchemaObject = {
        type: "string",
        minLength: 1,
        maxLength: 100,
        pattern: "^[a-zA-Z0-9]+$",
        enum: ["active", "inactive"],
      };

      const result = extractValidation(schema);

      expect(result).toEqual({
        minLength: 1,
        maxLength: 100,
        pattern: "^[a-zA-Z0-9]+$",
        enum: ["active", "inactive"],
      });
    });

    it("should return null for schema without validation", () => {
      const schema: SchemaObject = {
        type: "string",
      };

      const result = extractValidation(schema);

      expect(result).toBeNull();
    });

    it("should return null for empty schema", () => {
      const schema: SchemaObject = {};

      const result = extractValidation(schema);

      expect(result).toBeNull();
    });

    it("should handle partial validation", () => {
      const schema: SchemaObject = {
        type: "string",
        minLength: 5,
        // maxLengthは設定しない
      };

      const result = extractValidation(schema);

      expect(result).toEqual({
        minLength: 5,
      });
    });

    it("should handle zero values correctly", () => {
      const schema: SchemaObject = {
        type: "number",
        minimum: 0,
        minItems: 0,
        minProperties: 0,
      };

      const result = extractValidation(schema);

      expect(result).toEqual({
        minimum: 0,
        minItems: 0,
        minProperties: 0,
      });
    });

    it("should ignore non-validation properties", () => {
      const schema = {
        type: "string",
        title: "Username",
        description: "User's name",
        minLength: 3,
        maxLength: 20,
        customProperty: "ignored",
      } as SchemaObject;

      const result = extractValidation(schema);

      expect(result).toEqual({
        minLength: 3,
        maxLength: 20,
      });
    });

    it("should handle OpenAPI 3.0.x exclusiveMinimum/Maximum as boolean", () => {
      const schema: SchemaObject = {
        type: "number",
        minimum: 0,
        maximum: 100,
        exclusiveMinimum: true,
        exclusiveMaximum: true,
      };

      const result = extractValidation(schema);

      expect(result).toEqual({
        minimum: 0,
        maximum: 100,
        exclusiveMinimum: true,
        exclusiveMaximum: true,
      });
    });

    it("should extract validation format (uuid, email, etc.)", () => {
      const schema: SchemaObject = {
        type: "string",
        format: "uuid",
      };

      const result = extractValidation(schema);

      expect(result).toEqual({
        format: "uuid",
      });
    });

    it("should exclude scalar type formats (date, datetime, etc.)", () => {
      const dateSchema: SchemaObject = {
        type: "string",
        format: "date",
      };
      const dateTimeSchema: SchemaObject = {
        type: "string",
        format: "date-time",
      };
      const binarySchema: SchemaObject = {
        type: "string",
        format: "binary",
      };
      const byteSchema: SchemaObject = {
        type: "string",
        format: "byte",
      };

      expect(extractValidation(dateSchema)).toBeNull();
      expect(extractValidation(dateTimeSchema)).toBeNull();
      expect(extractValidation(binarySchema)).toBeNull();
      expect(extractValidation(byteSchema)).toBeNull();
    });

    it("should extract format with other validations", () => {
      const schema: SchemaObject = {
        type: "string",
        format: "email",
        minLength: 5,
        maxLength: 100,
      };

      const result = extractValidation(schema);

      expect(result).toEqual({
        minLength: 5,
        maxLength: 100,
        format: "email",
      });
    });
  });
}
