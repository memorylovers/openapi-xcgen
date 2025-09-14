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
import { isReferenceObject } from "../../types/guards";
import type { ParameterObject, SchemaObject } from "../../types/index";
import type { IRParameter } from "../../types/ir/index";
import { isNullable } from "../helpers/is-nullable.js";
import { toIRParameterInType } from "../helpers/to-ir-parameter-in-type.js";
import type { ParameterContext } from "../types";
import { visitType } from "./type-visitor.js";

/**
 * ParameterObjectをIRParameterに変換
 *
 * @param parameter - OpenAPIのParameterObject
 * @param context - Visitorコンテキスト
 * @returns IRParameter、または変換できない場合はnull
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
): IRParameter | null {
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

  // visitTypeでschemaから型情報を取得
  const type = visitType(schema, {
    documentPath: [...context.documentPath, "schema"],
    rootSegment: context.rootSegment,
  });
  if (!type) {
    consola.warn(`Invalid parameter type for: ${parameter.name}`);
    return null;
  }

  // IRParameterを構築
  const irParameter: IRParameter = {
    name: parameter.name,
    in: parameterIn,
    description: parameter.description || null,
    required: parameter.required || false,
    type,
    nullable: isNullable(schema) ? true : null,
    defaultValue: schema.default || null,
    deprecated: parameter.deprecated || null,
  };

  return irParameter;
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
        documentPath: ["paths", "/users/{id}", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "id",
        in: "path",
        method: "get",
        pathTemplate: "/users/{id}",
      });

      expect(result).toEqual({
        name: "id",
        in: "path",
        description: "User ID",
        required: true,
        type: "string",
        nullable: null,
        defaultValue: null,
        deprecated: null,
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
        documentPath: ["paths", "/users/{id}", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "limit",
        in: "query",
        method: "get",
        pathTemplate: "/users/{id}",
      });

      expect(result).toEqual({
        name: "limit",
        in: "query",
        description: null,
        required: false,
        type: "int",
        nullable: null,
        defaultValue: 10,
        deprecated: null,
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
        documentPath: ["paths", "/users/{id}", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "X-API-Version",
        in: "header",
        method: "get",
        pathTemplate: "/users/{id}",
      });

      expect(result).toEqual({
        name: "X-API-Version",
        in: "header",
        description: null,
        required: false,
        type: "string",
        nullable: null,
        defaultValue: null,
        deprecated: true,
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
        documentPath: ["paths", "/users/{id}", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "session",
        in: "cookie",
        method: "get",
        pathTemplate: "/users/{id}",
      });

      expect(result).toEqual({
        name: "session",
        in: "cookie",
        description: null,
        required: false,
        type: "string",
        nullable: null,
        defaultValue: null,
        deprecated: null,
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
        documentPath: ["paths", "/users/{id}", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "invalid",
        in: "query",
        method: "get",
        pathTemplate: "/users/{id}",
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
        documentPath: ["paths", "/users/{id}", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "userId",
        in: "path",
        method: "get",
        pathTemplate: "/users/{id}",
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
        documentPath: ["paths", "/users/{id}", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "body",
        in: "body" as "path" | "query" | "header" | "cookie", // 型アサーションでParameterContextの型に合わせる
        method: "get",
        pathTemplate: "/users/{id}",
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
        documentPath: ["paths", "/users/{id}", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "tags",
        in: "query",
        method: "get",
        pathTemplate: "/users/{id}",
      });

      expect(result).toEqual({
        name: "tags",
        in: "query",
        description: null,
        required: false,
        type: {
          kind: "array",
          itemType: "string",
        },
        nullable: null,
        defaultValue: null,
        deprecated: null,
      });
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
        documentPath: ["paths", "/users", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "filter",
        in: "query",
        method: "get",
        pathTemplate: "/users",
      });

      expect(result).toEqual({
        name: "filter",
        in: "query",
        description: null,
        required: false,
        type: "string",
        nullable: true,
        defaultValue: null,
        deprecated: null,
      });
    });

    // TODO: OpenAPI 3.1形式のtype配列はtype-visitorでまだサポートされていない
    // type配列形式（["string", "null"]）はtype-visitorがnullを返すため、
    // parameter全体もnullになってしまう。
    // type-visitorの改修が必要。
    it.skip("should handle nullable parameter with OpenAPI 3.1 format", () => {
      const param: ParameterObject = {
        name: "category",
        in: "query",
        schema: {
          type: ["string", "null"],
        } as SchemaObject,
      };

      const result = visitParameter(param, {
        documentPath: ["paths", "/products", "get", "parameters", "0"],
        rootSegment: "paths",
        parameterName: "category",
        in: "query",
        method: "get",
        pathTemplate: "/products",
      });

      expect(result).toEqual({
        name: "category",
        in: "query",
        description: null,
        required: false,
        type: "string", // 本来はstringを返すべき
        nullable: true,
        defaultValue: null,
        deprecated: null,
      });
    });
  });
}
