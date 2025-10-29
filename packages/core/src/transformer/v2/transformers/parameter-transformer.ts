/**
 * Parameter Transformer - v2 Transformer Architecture
 *
 * ParameterObjectをIRParameterに変換します。
 * スキーマの変換はschema-dispatcherに委譲します。
 */

import type {
  IRParameter,
  ParameterObject,
  SchemaObject,
} from "../../../types";
import { isReferenceObject } from "../../../types";
import {
  extractExtensions,
  extractValidation,
  isNullable,
  toIRParameterInType,
} from "../../helpers";
import type { VisitorContext } from "../../types";
import { dispatchSchema } from "../dispatchers/schema-dispatcher";
import { createParameterErrorResult } from "../errors";
import type { ParameterTransformResult } from "../types";

/**
 * ParameterObjectをIRParameterに変換
 *
 * @param parameter - OpenAPIのParameterObject
 * @param context - Visitorコンテキスト
 * @param dispatchFn - スキーマディスパッチャ関数（テスト時のモック用）
 * @returns 変換結果（IRParameterの型と子モデル）
 *
 * @example OpenAPI YAML
 * ```yaml
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     description: User ID
 *     schema:
 *       type: string
 *       format: uuid
 *   - name: limit
 *     in: query
 *     schema:
 *       type: integer
 *       default: 10
 *       minimum: 1
 *       maximum: 100
 * ```
 */
export function transformParameter(
  parameter: ParameterObject,
  context: VisitorContext,
  dispatchFn: typeof dispatchSchema = dispatchSchema,
): ParameterTransformResult {
  // schemaが必須
  if (!parameter.schema) {
    return createParameterErrorResult(
      `Parameter without schema: ${parameter.name}`,
      "PARAMETER_WITHOUT_SCHEMA",
      { parameter },
    );
  }

  // ReferenceObjectの場合は現時点でスキップ
  if (isReferenceObject(parameter.schema)) {
    return createParameterErrorResult(
      `Reference schema not supported yet in parameter: ${parameter.name}`,
      "PARAMETER_REF_NOT_SUPPORTED",
      { parameter },
    );
  }

  // SchemaObjectとして扱う
  const schema = parameter.schema as SchemaObject;

  // parameter.inの検証と変換
  const parameterIn = toIRParameterInType(parameter.in);
  if (!parameterIn) {
    return createParameterErrorResult(
      `Invalid parameter location: ${parameter.in} for parameter: ${parameter.name}`,
      "INVALID_PARAMETER_LOCATION",
      { parameter },
    );
  }

  // スキーマを変換（dispatchSchemaに委譲）
  // buildParameterSchemaModelNameとbuildInlineSchemaPathは旧コンテキスト形式を期待するため、
  // v2では documentPath を直接操作
  const inlineModelName = `${parameter.name.charAt(0).toUpperCase()}${parameter.name.slice(1)}`;
  const schemaDocumentPath = [
    ...context.documentPath,
    "schema",
    inlineModelName,
  ];

  const schemaContext: VisitorContext = {
    documentPath: schemaDocumentPath,
    rootSegment: context.rootSegment,
  };

  const schemaResult = dispatchFn(schema, schemaContext);

  if (!schemaResult.type) {
    return createParameterErrorResult(
      `Invalid parameter type for: ${parameter.name}`,
      "INVALID_PARAMETER_TYPE",
      { parameter, schemaResult },
    );
  }

  // バリデーション情報を抽出
  const validation = extractValidation(schema);

  // 拡張フィールドを抽出（parameter レベルの x-* も含む）
  const schemaExtensions = extractExtensions(schema);
  const parameterExtensions = extractExtensions(parameter);
  // parameter レベルの x-* が優先される
  const extensions =
    parameterExtensions || schemaExtensions
      ? { ...schemaExtensions, ...parameterExtensions }
      : undefined;

  // IRParameterを構築
  const irParameter: IRParameter = {
    name: parameter.name,
    in: parameterIn,
    type: schemaResult.type,
    ...(parameter.required && { required: true }),
    ...(parameter.description && { description: parameter.description }),
    ...(isNullable(schema) && { nullable: true }),
    ...(schema.default !== undefined && { defaultValue: schema.default }),
    ...(parameter.deprecated && { deprecated: parameter.deprecated }),
    ...(validation && { validation }),
    ...(extensions && { extensions }),
  };

  // ParameterTransformResultとして返す
  return {
    parameter: irParameter,
    models: schemaResult.models,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("transformParameter", () => {
    it("should handle path parameter", () => {
      const param: ParameterObject = {
        name: "id",
        in: "path",
        required: true,
        description: "User ID",
        schema: { type: "string" },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{id}", "get", "parameters", "0"],
        rootSegment: "paths",
      };

      const result = transformParameter(param, context);

      expect(result.parameter).toEqual({
        name: "id",
        in: "path",
        description: "User ID",
        required: true,
        type: "string",
      });
      expect(result.models).toEqual([]);
    });

    it("should handle query parameter with default value", () => {
      const param: ParameterObject = {
        name: "limit",
        in: "query",
        schema: {
          type: "integer",
          default: 10,
          minimum: 1,
          maximum: 100,
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "parameters", "0"],
        rootSegment: "paths",
      };

      const result = transformParameter(param, context);

      expect(result.parameter).toEqual({
        name: "limit",
        in: "query",
        type: "int",
        defaultValue: 10,
        validation: {
          minimum: 1,
          maximum: 100,
        },
      });
      expect(result.models).toEqual([]);
    });

    it("should handle header parameter with deprecated flag", () => {
      const param: ParameterObject = {
        name: "X-API-Version",
        in: "header",
        deprecated: true,
        schema: { type: "string" },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "parameters", "0"],
        rootSegment: "paths",
      };

      const result = transformParameter(param, context);

      expect(result.parameter).toEqual({
        name: "X-API-Version",
        in: "header",
        type: "string",
        deprecated: true,
      });
      expect(result.models).toEqual([]);
    });

    it("should handle cookie parameter", () => {
      const param: ParameterObject = {
        name: "session",
        in: "cookie",
        required: false,
        schema: { type: "string" },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "parameters", "0"],
        rootSegment: "paths",
      };

      const result = transformParameter(param, context);

      expect(result.parameter).toEqual({
        name: "session",
        in: "cookie",
        type: "string",
      });
      expect(result.models).toEqual([]);
    });

    it("should return error for parameter without schema", () => {
      const param: ParameterObject = {
        name: "invalid",
        in: "query",
        // schemaなし
      } as ParameterObject;

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "parameters", "0"],
        rootSegment: "paths",
      };

      const result = transformParameter(param, context);

      expect(result.parameter).toBeNull();
      expect(result.models).toEqual([]);
      expect(result.error?.code).toBe("PARAMETER_WITHOUT_SCHEMA");
    });

    it("should return error for parameter with reference schema", () => {
      const param: ParameterObject = {
        name: "userId",
        in: "path",
        schema: {
          $ref: "#/components/schemas/UserId",
        },
      } as ParameterObject;

      const context: VisitorContext = {
        documentPath: ["paths", "/users/{id}", "get", "parameters", "0"],
        rootSegment: "paths",
      };

      const result = transformParameter(param, context);

      expect(result.parameter).toBeNull();
      expect(result.models).toEqual([]);
      expect(result.error?.code).toBe("PARAMETER_REF_NOT_SUPPORTED");
    });

    it("should return error for invalid parameter location", () => {
      const param: ParameterObject = {
        name: "body",
        in: "body" as "path",
        schema: { type: "object" },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post", "parameters", "0"],
        rootSegment: "paths",
      };

      const result = transformParameter(param, context);

      expect(result.parameter).toBeNull();
      expect(result.models).toEqual([]);
      expect(result.error?.code).toBe("INVALID_PARAMETER_LOCATION");
    });

    it("should handle array type parameter", () => {
      const param: ParameterObject = {
        name: "tags",
        in: "query",
        style: "form",
        explode: true,
        schema: {
          type: "array",
          items: { type: "string" },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "parameters", "0"],
        rootSegment: "paths",
      };

      const result = transformParameter(param, context);

      // Array parameters now create models
      const paramType = result.parameter as IRParameter;
      expect(paramType.name).toBe("tags");
      expect(paramType.in).toBe("query");
      expect(paramType.type).toEqual({
        kind: "ref",
        name: expect.stringMatching(/Tags$/),
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0].kind).toBe("array");
      if (result.models[0].kind === "array") {
        expect(result.models[0].itemType).toBe("string");
      }
    });

    it("should handle nullable parameter with OpenAPI 3.0 format", () => {
      const param: ParameterObject = {
        name: "filter",
        in: "query",
        schema: {
          type: "string",
          nullable: true,
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "parameters", "0"],
        rootSegment: "paths",
      };

      const result = transformParameter(param, context);

      expect(result.parameter).toEqual({
        name: "filter",
        in: "query",
        type: "string",
        nullable: true,
      });
      expect(result.models).toEqual([]);
    });

    it("should handle nullable parameter with OpenAPI 3.1 format", () => {
      const param = {
        name: "category",
        in: "query",
        schema: {
          type: ["string", "null"],
        },
      } as unknown as ParameterObject;

      const context: VisitorContext = {
        documentPath: ["paths", "/products", "get", "parameters", "0"],
        rootSegment: "paths",
      };

      const result = transformParameter(param, context);

      expect(result.parameter).toEqual({
        name: "category",
        in: "query",
        type: "string",
        nullable: true,
      });
      expect(result.models).toEqual([]);
    });

    it("should extract string validation constraints", () => {
      const param: ParameterObject = {
        name: "username",
        in: "query",
        schema: {
          type: "string",
          minLength: 3,
          maxLength: 20,
          pattern: "^[a-zA-Z0-9_]+$",
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post", "parameters", "0"],
        rootSegment: "paths",
      };

      const result = transformParameter(param, context);

      expect(result.parameter).toEqual({
        name: "username",
        in: "query",
        type: "string",
        validation: {
          minLength: 3,
          maxLength: 20,
          pattern: "^[a-zA-Z0-9_]+$",
        },
      });
      expect(result.models).toEqual([]);
    });

    it("should extract array validation constraints", () => {
      const param: ParameterObject = {
        name: "tags",
        in: "query",
        schema: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 10,
          uniqueItems: true,
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/posts", "get", "parameters", "0"],
        rootSegment: "paths",
      };

      const result = transformParameter(param, context);

      // Array parameters now create models, but validation is on the parameter
      const paramType = result.parameter as IRParameter;
      expect(paramType.name).toBe("tags");
      expect(paramType.in).toBe("query");
      expect(paramType.type).toEqual({
        kind: "ref",
        name: expect.stringMatching(/Tags$/),
      });
      expect(paramType.validation).toEqual({
        minItems: 1,
        maxItems: 10,
        uniqueItems: true,
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0].kind).toBe("array");
    });
  });
}
