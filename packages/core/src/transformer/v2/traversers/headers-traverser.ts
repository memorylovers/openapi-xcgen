/**
 * Headers Traverser - v2 Transformer Architecture
 *
 * Responseのheadersフィールドを訪問し、
 * 各ヘッダーのスキーマを処理します。
 * スキーマの変換はschema-dispatcherに委譲します。
 */

import { consola } from "consola";
import type {
  IRModel,
  IRType,
  ReferenceObject,
  SchemaObject,
  SchemaObjectWithNullable,
} from "../../../types";
import { buildReferencePath } from "../../helpers";
import type { VisitorContext } from "../../types";
import type { HeadersTraversalResult } from "../types";

/**
 * スキーマ訪問関数の型
 */
type VisitSchemaFn = (
  schema: SchemaObjectWithNullable | ReferenceObject,
  context: VisitorContext,
) => { type: IRType | null; models: IRModel[] };

/**
 * HeaderObject型（OpenAPI 3.x）
 */
interface HeaderObject {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  schema?: SchemaObject | ReferenceObject;
  style?: string;
  explode?: boolean;
  example?: unknown;
  examples?: unknown;
}

/**
 * headersフィールド（ヘッダー名とHeaderObjectのマップ）を訪問
 *
 * @param headers - headersオブジェクト（例: { "X-Rate-Limit": { schema: { type: "integer" } } }）
 * @param context - 親コンテキスト
 * @param visitSchema - スキーマ訪問関数（再帰用）
 * @returns HeadersTraversalResult
 *
 * @example OpenAPI YAML
 * ```yaml
 * headers:
 *   X-Rate-Limit:
 *     description: Rate limit remaining
 *     schema:
 *       type: integer
 *   X-Total-Count:
 *     schema:
 *       type: integer
 *     deprecated: true
 * ```
 */
export function traverseHeaders(
  headers:
    | {
        [header: string]: HeaderObject | ReferenceObject;
      }
    | undefined,
  context: VisitorContext,
  visitSchema: VisitSchemaFn,
): HeadersTraversalResult {
  // headersが未定義または空の場合
  if (!headers || Object.keys(headers).length === 0) {
    return {
      headers: [],
      childModels: [],
    };
  }

  const visitedHeaders: HeadersTraversalResult["headers"] = [];
  const allChildModels: IRModel[] = [];

  // 各ヘッダーを訪問
  Object.entries(headers).forEach(([headerName, headerObject]) => {
    // ReferenceObjectの場合は現時点でスキップ
    if ("$ref" in headerObject) {
      consola.debug(
        `Header reference not supported yet: ${headerName} at ${buildReferencePath(context.documentPath)}`,
      );
      return;
    }

    const header = headerObject as HeaderObject;

    // schemaが存在しない場合はスキップ
    if (!header.schema) {
      consola.warn(
        `Header without schema: ${headerName} at ${buildReferencePath(context.documentPath)}`,
      );
      return;
    }

    // スキーマコンテキストを作成
    const schemaContext: VisitorContext = {
      documentPath: [...context.documentPath, "headers", headerName, "schema"],
      rootSegment: context.rootSegment,
    };

    // スキーマを訪問
    const result = visitSchema(header.schema, schemaContext);

    visitedHeaders.push({
      name: headerName,
      type: result.type,
      ...(header.description && { description: header.description }),
      ...(header.schema &&
        "default" in header.schema &&
        header.schema.default !== undefined && {
          defaultValue: header.schema.default,
        }),
      ...(header.deprecated && { deprecated: true }),
    });

    allChildModels.push(...result.models);
  });

  return {
    headers: visitedHeaders,
    childModels: allChildModels,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("traverseHeaders", () => {
    it("should handle empty headers", () => {
      const mockVisitSchema = vi.fn();

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      };

      const result = traverseHeaders({}, context, mockVisitSchema);

      expect(result.headers).toEqual([]);
      expect(result.childModels).toEqual([]);
      expect(mockVisitSchema).not.toHaveBeenCalled();
    });

    it("should handle undefined headers", () => {
      const mockVisitSchema = vi.fn();

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      };

      const result = traverseHeaders(undefined, context, mockVisitSchema);

      expect(result.headers).toEqual([]);
      expect(result.childModels).toEqual([]);
      expect(mockVisitSchema).not.toHaveBeenCalled();
    });

    it("should process single header with integer schema", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "int",
        models: [],
      });

      const headers = {
        "X-Rate-Limit": {
          description: "Rate limit remaining",
          schema: { type: "integer" as const },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/api", "get", "responses", "200"],
        rootSegment: "paths",
      };

      const result = traverseHeaders(headers, context, mockVisitSchema);

      expect(result.headers).toHaveLength(1);
      expect(result.headers[0]).toEqual({
        name: "X-Rate-Limit",
        type: "int",
        description: "Rate limit remaining",
      });
      expect(result.childModels).toEqual([]);

      expect(mockVisitSchema).toHaveBeenCalledWith(
        { type: "integer" },
        {
          documentPath: [
            "paths",
            "/api",
            "get",
            "responses",
            "200",
            "headers",
            "X-Rate-Limit",
            "schema",
          ],
          rootSegment: "paths",
        },
      );
    });

    it("should process multiple headers", () => {
      const mockVisitSchema = vi
        .fn()
        .mockReturnValueOnce({
          type: "int",
          models: [],
        })
        .mockReturnValueOnce({
          type: "string",
          models: [],
        });

      const headers = {
        "X-Total-Count": {
          schema: { type: "integer" as const },
        },
        "X-Request-Id": {
          description: "Request identifier",
          schema: { type: "string" as const },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      };

      const result = traverseHeaders(headers, context, mockVisitSchema);

      expect(result.headers).toHaveLength(2);
      expect(result.headers[0]).toEqual({
        name: "X-Total-Count",
        type: "int",
      });
      expect(result.headers[1]).toEqual({
        name: "X-Request-Id",
        type: "string",
        description: "Request identifier",
      });
    });

    it("should handle deprecated header", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "string",
        models: [],
      });

      const headers = {
        "X-API-Version": {
          deprecated: true,
          schema: { type: "string" as const },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      };

      const result = traverseHeaders(headers, context, mockVisitSchema);

      expect(result.headers).toHaveLength(1);
      expect(result.headers[0]).toEqual({
        name: "X-API-Version",
        type: "string",
        deprecated: true,
      });
    });

    it("should handle header with default value", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "int",
        models: [],
      });

      const headers = {
        "X-Page-Size": {
          schema: { type: "integer" as const, default: 10 },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      };

      const result = traverseHeaders(headers, context, mockVisitSchema);

      expect(result.headers).toHaveLength(1);
      expect(result.headers[0]).toEqual({
        name: "X-Page-Size",
        type: "int",
        defaultValue: 10,
      });
    });

    it("should skip header without schema", () => {
      const mockVisitSchema = vi.fn();

      const headers = {
        "X-Empty": {
          description: "Empty header",
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      };

      const result = traverseHeaders(headers, context, mockVisitSchema);

      expect(result.headers).toEqual([]);
      expect(mockVisitSchema).not.toHaveBeenCalled();
    });

    it("should skip header reference", () => {
      const mockVisitSchema = vi.fn();

      const headers = {
        "X-Ref-Header": {
          $ref: "#/components/headers/CommonHeader",
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      };

      const result = traverseHeaders(headers, context, mockVisitSchema);

      expect(result.headers).toEqual([]);
      expect(mockVisitSchema).not.toHaveBeenCalled();
    });

    it("should collect child models from schema resolution", () => {
      const mockModel: IRModel = {
        kind: "object",
        name: "HeaderModel",
        referencePath: "#/test",
        properties: [],
      };

      const mockVisitSchema = vi.fn().mockReturnValue({
        type: { kind: "ref", name: "#/test" },
        models: [mockModel],
      });

      const headers = {
        "X-Custom": {
          schema: {
            type: "object" as const,
            properties: { field: { type: "string" as const } },
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      };

      const result = traverseHeaders(headers, context, mockVisitSchema);

      expect(result.childModels).toHaveLength(1);
      expect(result.childModels[0]).toBe(mockModel);
    });
  });
}
