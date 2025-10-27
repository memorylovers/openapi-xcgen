/**
 * parameter-visitor.ts - ParameterObjectをIRParameterに変換
 *
 * OpenAPIのParameterObject（path/query/header/cookieパラメータ）を処理し、
 * IRParameterに変換する。
 *
 * 責務:
 * - パラメータの基本情報（name、in、required）の抽出
 * - schemaからの型情報の解決（visitTypeに委譲）
 * - デフォルト値、説明、非推奨フラグの処理
 * - バリデーション情報の抽出（minimum、maximum等）
 */

import { consola } from "consola";
import type {
  IRModel,
  IRParameter,
  ParameterObject,
  SchemaObject,
} from "../../../types";
import { isReferenceObject } from "../../../types";
import {
  buildInlineSchemaPath,
  buildParameterSchemaModelName,
  extractExtensions,
  extractValidation,
  isNullable,
  toIRParameterInType,
} from "../../helpers";
import type { ParameterContext } from "../../types";
import { visitSchema } from "../schema";

/**
 * Parameter処理の結果
 */
export interface ParameterResult {
  /** パラメータ情報 */
  parameter: IRParameter;
  /** 配列型から抽出されたモデル */
  models: IRModel[];
}

/**
 * ParameterObjectをIRParameterとモデルに変換
 *
 * @param parameter - OpenAPIのParameterObject
 * @param context - Visitorコンテキスト
 * @returns ParameterResult、または変換できない場合はnull
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
 *     required: false
 *     schema:
 *       type: integer
 *       default: 10
 *       minimum: 1
 *       maximum: 100
 * ```
 */
export function visitParameter(
  parameter: ParameterObject,
  context: ParameterContext,
): ParameterResult | null {
  // schemaが必須
  if (!parameter.schema) {
    consola.warn(`Parameter without schema: ${parameter.name}`);
    return null;
  }

  // ReferenceObjectの場合は現時点でスキップ
  if (isReferenceObject(parameter.schema)) {
    consola.warn(
      `Reference schema not supported yet in parameter: ${parameter.name}`,
    );
    return null;
  }

  // SchemaObjectとして扱う
  const schema = parameter.schema as SchemaObject;

  // parameter.inの検証と変換
  const parameterIn = toIRParameterInType(parameter.in);
  if (!parameterIn) {
    consola.warn(
      `Invalid parameter location: ${parameter.in} for parameter: ${parameter.name}`,
    );
    return null;
  }

  // すべての型をvisitSchemaで処理（中央ディスパッチャーとして）
  const models: IRModel[] = [];
  const inlineModelName = buildParameterSchemaModelName(context);
  const schemaResult = visitSchema(schema, {
    documentPath: buildInlineSchemaPath(context, inlineModelName),
    rootSegment: context.rootSegment,
  });

  if (!schemaResult.type) {
    consola.warn(`Invalid parameter type for: ${parameter.name}`);
    return null;
  }

  const type = schemaResult.type;
  models.push(...schemaResult.models);

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
    type,
    ...(parameter.required && { required: true }),
    ...(parameter.description && { description: parameter.description }),
    ...(isNullable(schema) && { nullable: true }),
    ...(schema.default !== undefined && { defaultValue: schema.default }),
    ...(parameter.deprecated && { deprecated: parameter.deprecated }),
    ...(validation && { validation }),
    ...(extensions && { extensions }),
  };

  return {
    parameter: irParameter,
    models,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitParameter", () => {
    it("should handle path parameter", () => {
      const param: ParameterObject = {
        name: "id",
        in: "path",
        required: true,
        description: "User ID",
        schema: { type: "string" },
      };

      const result = visitParameter(param, {
        kind: "parameter",
        documentPath: ["paths", "/users/{id}", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "id",
        in: "path",
      });

      expect(result).toEqual({
        parameter: {
          name: "id",
          in: "path",
          description: "User ID",
          required: true,
          type: "string",
        },
        models: [],
      });
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

      const result = visitParameter(param, {
        kind: "parameter",
        documentPath: ["paths", "/users/{id}", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "limit",
        in: "query",
      });

      expect(result).toEqual({
        parameter: {
          name: "limit",
          in: "query",
          type: "int",
          defaultValue: 10,
          validation: {
            minimum: 1,
            maximum: 100,
          },
        },
        models: [],
      });
    });

    it("should handle header parameter with deprecated flag", () => {
      const param: ParameterObject = {
        name: "X-API-Version",
        in: "header",
        deprecated: true,
        schema: { type: "string" },
      };

      const result = visitParameter(param, {
        kind: "parameter",
        documentPath: ["paths", "/users/{id}", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "X-API-Version",
        in: "header",
      });

      expect(result).toEqual({
        parameter: {
          name: "X-API-Version",
          in: "header",
          type: "string",
          deprecated: true,
        },
        models: [],
      });
    });

    it("should handle cookie parameter", () => {
      const param: ParameterObject = {
        name: "session",
        in: "cookie",
        required: false,
        schema: { type: "string" },
      };

      const result = visitParameter(param, {
        kind: "parameter",
        documentPath: ["paths", "/users/{id}", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "session",
        in: "cookie",
      });

      expect(result).toEqual({
        parameter: {
          name: "session",
          in: "cookie",
          type: "string",
        },
        models: [],
      });
    });

    it("should warn and return null for parameter without schema", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const param: ParameterObject = {
        name: "invalid",
        in: "query",
        // schemaなし
      } as ParameterObject;

      const result = visitParameter(param, {
        kind: "parameter",
        documentPath: ["paths", "/users/{id}", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "invalid",
        in: "query",
      });

      expect(result).toEqual(null);
      expect(warnSpy).toHaveBeenCalledWith("Parameter without schema: invalid");

      warnSpy.mockRestore();
    });

    it("should warn and return null for parameter with reference schema", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const param: ParameterObject = {
        name: "userId",
        in: "path",
        schema: {
          $ref: "#/components/schemas/UserId",
        },
      } as ParameterObject;

      const result = visitParameter(param, {
        kind: "parameter",
        documentPath: ["paths", "/users/{id}", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "userId",
        in: "path",
      });

      expect(result).toEqual(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "Reference schema not supported yet in parameter: userId",
      );

      warnSpy.mockRestore();
    });

    it("should warn and return null for invalid parameter location", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const param: ParameterObject = {
        name: "body",
        in: "body" as "path", // OpenAPI 2.xのbodyはOpenAPI 3.xでは無効なのでテスト用にpathとしてキャスト
        schema: { type: "object" },
      };

      const result = visitParameter(param, {
        kind: "parameter",
        documentPath: ["paths", "/users/{id}", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "body",
        in: "body" as "path" | "query" | "header" | "cookie", // 型アサーションでParameterContextの型に合わせる
      });

      expect(result).toEqual(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "Invalid parameter location: body for parameter: body",
      );

      warnSpy.mockRestore();
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

      const result = visitParameter(param, {
        kind: "parameter",
        documentPath: ["paths", "/users/{id}", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "tags",
        in: "query",
      });

      // Array parameters now create models
      expect(result?.parameter.name).toBe("tags");
      expect(result?.parameter.in).toBe("query");
      expect(result?.parameter.type).toEqual({
        kind: "ref",
        name: "#/paths/::users::{id}/get/parameters/GetUsersIdParamsTags",
      });
      expect(result?.models).toHaveLength(1);
      expect(result?.models[0].kind).toBe("array");
      if (result?.models[0].kind === "array") {
        expect(result.models[0].itemType).toBe("string");
        expect(result.models[0].referencePath).toBe(
          "#/paths/::users::{id}/get/parameters/GetUsersIdParamsTags",
        );
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

      const result = visitParameter(param, {
        kind: "parameter",
        documentPath: ["paths", "/users", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "filter",
        in: "query",
      });

      expect(result).toEqual({
        parameter: {
          name: "filter",
          in: "query",
          type: "string",
          nullable: true,
        },
        models: [],
      });
    });

    it("should handle nullable parameter with OpenAPI 3.1 format", () => {
      const param = {
        name: "category",
        in: "query",
        schema: {
          type: ["string", "null"],
        },
      } as unknown as ParameterObject;

      const result = visitParameter(param, {
        kind: "parameter",
        documentPath: ["paths", "/products", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "category",
        in: "query",
      });

      expect(result).toEqual({
        parameter: {
          name: "category",
          in: "query",
          type: "string",
          nullable: true,
        },
        models: [],
      });
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

      const result = visitParameter(param, {
        kind: "parameter",
        documentPath: ["paths", "/users", "post", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "username",
        in: "query",
      });

      expect(result).toEqual({
        parameter: {
          name: "username",
          in: "query",
          type: "string",
          validation: {
            minLength: 3,
            maxLength: 20,
            pattern: "^[a-zA-Z0-9_]+$",
          },
        },
        models: [],
      });
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

      const result = visitParameter(param, {
        kind: "parameter",
        documentPath: ["paths", "/posts", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "tags",
        in: "query",
      });

      // Array parameters now create models, but validation is on the parameter
      expect(result?.parameter.name).toBe("tags");
      expect(result?.parameter.in).toBe("query");
      expect(result?.parameter.type).toEqual({
        kind: "ref",
        name: "#/paths/::posts/get/parameters/GetPostsParamsTags",
      });
      expect(result?.parameter.validation).toEqual({
        minItems: 1,
        maxItems: 10,
        uniqueItems: true,
      });
      expect(result?.models).toHaveLength(1);
      expect(result?.models[0].kind).toBe("array");
      if (result?.models[0].kind === "array") {
        expect(result.models[0].referencePath).toBe(
          "#/paths/::posts/get/parameters/GetPostsParamsTags",
        );
      }
    });
  });
}
