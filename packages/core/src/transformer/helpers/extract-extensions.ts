import type {
  Extensions,
  OperationObject,
  ParameterObject,
  PathItemObject,
  SchemaObject,
} from "../../types";

/**
 * x-extensions を持つ可能性のある OpenAPI オブジェクト
 */
type ExtensibleOpenAPIObject =
  | SchemaObject
  | ParameterObject
  | OperationObject
  | PathItemObject;

/**
 * OpenAPI オブジェクトから x-* 拡張フィールドを抽出
 *
 * OpenAPI の x- プレフィックスを持つフィールドを抽出し、Extensions として返す。
 * Core はこれらのフィールドを解釈せず、そのまま IR に保持する（パススルー方式）。
 *
 * @param obj - 抽出対象の OpenAPI オブジェクト
 * @returns 拡張フィールドのマップ、存在しない場合は undefined
 *
 * @see https://spec.openapis.org/oas/v3.0.3#specification-extensions
 * @see https://spec.openapis.org/oas/v3.1.0#specification-extensions
 *
 * @example OpenAPI YAML
 * ```yaml
 * properties:
 *   email:
 *     type: string
 *     format: email
 *     x-type: "EmailAddress"
 *     x-format: "rfc5322"
 *     x-validation:
 *       domain: "example.com"
 *       allowSubdomains: true
 * ```
 *
 * @example IR JSON
 * ```json
 * {
 *   "name": "email",
 *   "type": "string",
 *   "extensions": {
 *     "x-type": "EmailAddress",
 *     "x-format": "rfc5322",
 *     "x-validation": {
 *       "domain": "example.com",
 *       "allowSubdomains": true
 *     }
 *   }
 * }
 * ```
 */
export function extractExtensions(
  obj: ExtensibleOpenAPIObject,
): Extensions | undefined {
  // objがnullやundefinedの場合はundefinedを返す
  if (!obj) {
    return undefined;
  }

  const extensions: Extensions = {};

  // x- プレフィックスを持つフィールドを抽出
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("x-")) {
      extensions[key] = value as Extensions[string];
    }
  }

  // 拡張フィールドが存在しない場合はundefinedを返す
  const hasExtensions = Object.keys(extensions).length > 0;
  return hasExtensions ? extensions : undefined;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("extractExtensions", () => {
    it("should extract x- fields from schema", () => {
      const schema = {
        type: "string",
        format: "email",
        "x-type": "EmailAddress",
        "x-format": "rfc5322",
      } as SchemaObject;

      const result = extractExtensions(schema);

      expect(result).toEqual({
        "x-type": "EmailAddress",
        "x-format": "rfc5322",
      });
    });

    it("should extract nested x- fields", () => {
      const schema = {
        type: "string",
        "x-validation": {
          domain: "example.com",
          allowSubdomains: true,
          maxLength: 255,
        },
      } as SchemaObject;

      const result = extractExtensions(schema);

      expect(result).toEqual({
        "x-validation": {
          domain: "example.com",
          allowSubdomains: true,
          maxLength: 255,
        },
      });
    });

    it("should extract multiple x- fields with different types", () => {
      const schema = {
        type: "string",
        "x-type": "UserId",
        "x-format": "uuid-v7",
        "x-priority": 1,
        "x-required": true,
        "x-tags": ["internal", "beta"],
        "x-metadata": null,
      } as SchemaObject;

      const result = extractExtensions(schema);

      expect(result).toEqual({
        "x-type": "UserId",
        "x-format": "uuid-v7",
        "x-priority": 1,
        "x-required": true,
        "x-tags": ["internal", "beta"],
        "x-metadata": null,
      });
    });

    it("should ignore non-x- prefixed fields", () => {
      const schema = {
        type: "string",
        format: "email",
        title: "Email Field",
        description: "User email",
        "x-type": "EmailAddress",
        "custom-field": "ignored",
        myExtension: "also ignored",
      } as unknown as SchemaObject;

      const result = extractExtensions(schema);

      expect(result).toEqual({
        "x-type": "EmailAddress",
      });
    });

    it("should return undefined when no x- fields exist", () => {
      const schema = {
        type: "string",
        format: "email",
        minLength: 5,
        maxLength: 100,
      } as SchemaObject;

      const result = extractExtensions(schema);

      expect(result).toBeUndefined();
    });

    it("should return undefined for empty schema", () => {
      const schema = {} as SchemaObject;

      const result = extractExtensions(schema);

      expect(result).toBeUndefined();
    });

    it("should extract empty object as x- value", () => {
      const schema = {
        type: "string",
        "x-metadata": {},
      } as SchemaObject;

      const result = extractExtensions(schema);

      expect(result).toEqual({
        "x-metadata": {},
      });
    });

    it("should extract empty array as x- value", () => {
      const schema = {
        type: "string",
        "x-tags": [],
      } as SchemaObject;

      const result = extractExtensions(schema);

      expect(result).toEqual({
        "x-tags": [],
      });
    });

    it("should extract deeply nested x- values", () => {
      const schema = {
        type: "object",
        "x-config": {
          level1: {
            level2: {
              level3: {
                value: "deep",
                nested: true,
              },
            },
          },
        },
      } as SchemaObject;

      const result = extractExtensions(schema);

      expect(result).toEqual({
        "x-config": {
          level1: {
            level2: {
              level3: {
                value: "deep",
                nested: true,
              },
            },
          },
        },
      });
    });

    it("should extract array with mixed types", () => {
      const schema = {
        type: "string",
        "x-values": ["string", 42, true, null, { key: "value" }],
      } as SchemaObject;

      const result = extractExtensions(schema);

      expect(result).toEqual({
        "x-values": ["string", 42, true, null, { key: "value" }],
      });
    });

    it("should handle multiple x- fields of same type", () => {
      const schema = {
        type: "string",
        "x-validation": {
          min: 1,
          max: 100,
        },
        "x-serialization": {
          format: "uppercase",
          trim: true,
        },
        "x-display": {
          label: "Email Address",
          placeholder: "user@example.com",
        },
      } as SchemaObject;

      const result = extractExtensions(schema);

      expect(result).toEqual({
        "x-validation": {
          min: 1,
          max: 100,
        },
        "x-serialization": {
          format: "uppercase",
          trim: true,
        },
        "x-display": {
          label: "Email Address",
          placeholder: "user@example.com",
        },
      });
    });

    it("should preserve x- fields with special characters in keys", () => {
      const schema = {
        type: "string",
        "x-my-extension": "value",
        "x-foo_bar": "value",
        "x-CamelCase": "value",
      } as SchemaObject;

      const result = extractExtensions(schema);

      expect(result).toEqual({
        "x-my-extension": "value",
        "x-foo_bar": "value",
        "x-CamelCase": "value",
      });
    });

    it("should extract OpenAPI reserved prefixes (x-oai-*, x-oas-*)", () => {
      const schema = {
        type: "string",
        "x-oai-custom": "reserved",
        "x-oas-feature": "also-reserved",
        "x-my-field": "not-reserved",
      } as SchemaObject;

      const result = extractExtensions(schema);

      expect(result).toEqual({
        "x-oai-custom": "reserved",
        "x-oas-feature": "also-reserved",
        "x-my-field": "not-reserved",
      });
    });
  });
}
