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
import type { ParameterObject, SchemaObject } from "../../types/index";
import type { IRParameter } from "../../types/ir/index";
import type { VisitorContext } from "../types";
import { isReferenceObject } from "../../types/guards";
import { toIRParameterInType } from "../helpers/to-ir-parameter-in-type";
import { visitType } from "./type-visitor";

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
  _context: VisitorContext,
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
  const type = visitType(schema);
  if (!type) {
    consola.warn(`Invalid parameter type for: ${parameter.name}`);
    return null;
  }

  // IRParameterを構築
  return {
    name: parameter.name,
    in: parameterIn,
    description: parameter.description,
    required: parameter.required || false,
    type,
    defaultValue: schema.default,
    deprecated: parameter.deprecated,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;
  const { createContext } = await import("../types");

  describe("visitParameter", () => {
    it("should handle path parameter", () => {
      const param: ParameterObject = {
        name: "id",
        in: "path",
        required: true,
        description: "User ID",
        schema: { type: "string" },
      };

      const result = visitParameter(param, createContext());

      expect(result).toEqual({
        name: "id",
        in: "path",
        required: true,
        description: "User ID",
        type: { kind: "primitive", type: "string" },
        deprecated: undefined,
        defaultValue: undefined,
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

      const result = visitParameter(param, createContext());

      expect(result).toEqual({
        name: "limit",
        in: "query",
        required: false,
        description: undefined,
        type: { kind: "primitive", type: "integer" },
        defaultValue: 10,
        deprecated: undefined,
      });
    });

    it("should handle header parameter with deprecated flag", () => {
      const param: ParameterObject = {
        name: "X-API-Version",
        in: "header",
        deprecated: true,
        schema: { type: "string" },
      };

      const result = visitParameter(param, createContext());

      expect(result).toEqual({
        name: "X-API-Version",
        in: "header",
        required: false,
        description: undefined,
        type: { kind: "primitive", type: "string" },
        defaultValue: undefined,
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

      const result = visitParameter(param, createContext());

      expect(result).toEqual({
        name: "session",
        in: "cookie",
        required: false,
        description: undefined,
        type: { kind: "primitive", type: "string" },
        defaultValue: undefined,
        deprecated: undefined,
      });
    });

    it("should warn and return null for parameter without schema", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const param: ParameterObject = {
        name: "invalid",
        in: "query",
        // schemaなし
      } as ParameterObject;

      const result = visitParameter(param, createContext());

      expect(result).toBeNull();
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

      const result = visitParameter(param, createContext());

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        "Reference schema not supported yet in parameter: userId",
      );

      warnSpy.mockRestore();
    });

    it("should warn and return null for invalid parameter location", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const param = {
        name: "body",
        in: "body", // OpenAPI 2.xのbodyはOpenAPI 3.xでは無効
        schema: { type: "object" },
      } as ParameterObject;

      const result = visitParameter(param, createContext());

      expect(result).toBeNull();
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

      const result = visitParameter(param, createContext());

      expect(result).toEqual({
        name: "tags",
        in: "query",
        required: false,
        description: undefined,
        type: {
          kind: "array",
          itemType: { kind: "primitive", type: "string" },
        },
        defaultValue: undefined,
        deprecated: undefined,
      });
    });
  });
}
