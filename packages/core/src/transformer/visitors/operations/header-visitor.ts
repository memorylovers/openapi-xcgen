/**
 * header-visitor.ts - HeaderObjectをIRResponseHeaderに変換
 *
 * OpenAPIのHeaderObject（レスポンスヘッダー）を処理し、
 * IRResponseHeaderに変換する。
 *
 * 責務:
 * - ヘッダーの基本情報（name、description、deprecated）の抽出
 * - schemaからの型情報の解決（visitTypeに委譲）
 * - デフォルト値の処理
 */

import { consola } from "consola";
import type {
  HeaderObject,
  IRModel,
  IRResponseHeader,
  SchemaObject,
} from "../../../types";
import { isReferenceObject } from "../../../types";
import type { HeaderContext } from "../../types";
import { visitSchema } from "../schema";

/**
 * Header処理の結果
 */
export interface HeaderResult {
  /** ヘッダー情報 */
  header: IRResponseHeader;
  /** 配列型から抽出されたモデル */
  models: IRModel[];
}

/**
 * HeaderObjectをIRResponseHeaderとモデルに変換
 *
 * @param headerObj - OpenAPIのHeaderObject
 * @param context - Visitorコンテキスト
 * @returns HeaderResult、または変換できない場合はnull
 *
 * @example OpenAPI YAML
 * ```yaml
 * headers:
 *   Location:
 *     description: Redirect URL
 *     schema:
 *       type: string
 *       format: uri
 *   X-Rate-Limit:
 *     description: Rate limit
 *     schema:
 *       type: integer
 *     deprecated: true
 * ```
 */
export function visitHeader(
  headerObj: HeaderObject,
  context: HeaderContext,
): HeaderResult | null {
  // schemaが必須
  if (!headerObj.schema) {
    consola.warn(`Header without schema: ${context.headerName}`);
    return null;
  }

  // ReferenceObjectの場合は現時点でスキップ
  if (isReferenceObject(headerObj.schema)) {
    consola.warn(
      `Reference schema not supported yet in header: ${context.headerName}`,
    );
    return null;
  }

  // SchemaObjectとして扱う
  const schema = headerObj.schema as SchemaObject;

  // すべての型をvisitSchemaで処理（中央ディスパッチャーとして）
  const models: IRModel[] = [];
  const schemaResult = visitSchema(schema, {
    documentPath: [...context.documentPath, "schema"],
    rootSegment: context.rootSegment,
  });

  if (!schemaResult.type) {
    consola.warn(`Invalid header type for: ${context.headerName}`);
    return null;
  }

  const type = schemaResult.type;
  models.push(...schemaResult.models);

  // IRResponseHeaderを構築
  const irHeader: IRResponseHeader = {
    name: context.headerName,
    type,
    ...(headerObj.description && { description: headerObj.description }),
    ...(schema.default !== undefined && { defaultValue: schema.default }),
    ...(headerObj.deprecated && { deprecated: headerObj.deprecated }),
  };

  return {
    header: irHeader,
    models,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitHeader", () => {
    it("should handle header with string type", () => {
      const header: HeaderObject = {
        description: "Redirect URL",
        schema: { type: "string", format: "uri" },
      };

      const result = visitHeader(header, {
        kind: "header",
        documentPath: [
          "paths",
          "/users",
          "post",
          "responses",
          "201",
          "headers",
          "Location",
        ],
        rootSegment: "paths",
        headerName: "Location",
        method: "post",
        pathTemplate: "/users",
        statusCode: "201",
      });

      expect(result).toEqual({
        header: {
          name: "Location",
          description: "Redirect URL",
          type: "string",
        },
        models: [],
      });
    });

    it("should handle header with integer type", () => {
      const header: HeaderObject = {
        description: "Rate limit",
        schema: { type: "integer" },
      };

      const result = visitHeader(header, {
        kind: "header",
        documentPath: [
          "paths",
          "/api/v1/resource",
          "get",
          "responses",
          "200",
          "headers",
          "X-Rate-Limit",
        ],
        rootSegment: "paths",
        headerName: "X-Rate-Limit",
        method: "get",
        pathTemplate: "/api/v1/resource",
        statusCode: "200",
      });

      expect(result).toEqual({
        header: {
          name: "X-Rate-Limit",
          description: "Rate limit",
          type: "int",
        },
        models: [],
      });
    });

    it("should handle deprecated header", () => {
      const header: HeaderObject = {
        description: "Legacy API version",
        deprecated: true,
        schema: { type: "string" },
      };

      const result = visitHeader(header, {
        kind: "header",
        documentPath: [
          "paths",
          "/users",
          "get",
          "responses",
          "200",
          "headers",
          "X-API-Version",
        ],
        rootSegment: "paths",
        headerName: "X-API-Version",
        method: "get",
        pathTemplate: "/users",
        statusCode: "200",
      });

      expect(result).toEqual({
        header: {
          name: "X-API-Version",
          description: "Legacy API version",
          type: "string",
          deprecated: true,
        },
        models: [],
      });
    });

    it("should handle header with default value", () => {
      const header: HeaderObject = {
        description: "Content type",
        schema: { type: "string", default: "application/json" },
      };

      const result = visitHeader(header, {
        kind: "header",
        documentPath: [
          "paths",
          "/data",
          "get",
          "responses",
          "200",
          "headers",
          "Content-Type",
        ],
        rootSegment: "paths",
        headerName: "Content-Type",
        method: "get",
        pathTemplate: "/data",
        statusCode: "200",
      });

      expect(result).toEqual({
        header: {
          name: "Content-Type",
          description: "Content type",
          type: "string",
          defaultValue: "application/json",
        },
        models: [],
      });
    });

    it("should warn and return null for header without schema", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const header: HeaderObject = {
        description: "Invalid header",
        // schemaなし
      } as HeaderObject;

      const result = visitHeader(header, {
        kind: "header",
        documentPath: [
          "paths",
          "/test",
          "get",
          "responses",
          "200",
          "headers",
          "X-Invalid",
        ],
        rootSegment: "paths",
        headerName: "X-Invalid",
        method: "get",
        pathTemplate: "/test",
        statusCode: "200",
      });

      expect(result).toEqual(null);
      expect(warnSpy).toHaveBeenCalledWith("Header without schema: X-Invalid");

      warnSpy.mockRestore();
    });

    it("should warn and return null for header with reference schema", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const header: HeaderObject = {
        description: "Reference header",
        schema: {
          $ref: "#/components/schemas/CustomHeader",
        },
      } as HeaderObject;

      const result = visitHeader(header, {
        kind: "header",
        documentPath: [
          "paths",
          "/test",
          "get",
          "responses",
          "200",
          "headers",
          "X-Custom",
        ],
        rootSegment: "paths",
        headerName: "X-Custom",
        method: "get",
        pathTemplate: "/test",
        statusCode: "200",
      });

      expect(result).toEqual(null);
      expect(warnSpy).toHaveBeenCalledWith(
        "Reference schema not supported yet in header: X-Custom",
      );

      warnSpy.mockRestore();
    });

    it("should handle header from components context", () => {
      const header: HeaderObject = {
        description: "Retry after seconds",
        schema: { type: "integer" },
      };

      const result = visitHeader(header, {
        kind: "header",
        documentPath: ["components", "headers", "Retry-After"],
        rootSegment: "components",
        headerName: "Retry-After",
        method: null,
        pathTemplate: null,
        statusCode: "429",
      });

      expect(result).toEqual({
        header: {
          name: "Retry-After",
          description: "Retry after seconds",
          type: "int",
        },
        models: [],
      });
    });
  });
}
