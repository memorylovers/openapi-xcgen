/**
 * Content Traverser - v2 Transformer Architecture
 *
 * RequestBodyとResponseのcontentフィールドを訪問し、
 * 各MIMEタイプのスキーマを処理します。
 * スキーマの変換はschema-dispatcherに委譲します。
 */

import { consola } from "consola";
import type {
  IRModel,
  IRType,
  MimeType,
  ReferenceObject,
  SchemaObject,
  SchemaObjectWithNullable,
} from "../../../types";
import { buildReferencePath } from "../../helpers";
import type {
  ComponentsRequestBodyContext,
  ComponentsResponseContext,
  PathsRequestBodyContext,
  PathsResponseContext,
  VisitorContext,
} from "../../types";
import type { ContentTraversalResult } from "../types";

/**
 * スキーマ訪問関数の型
 */
type VisitSchemaFn = (
  schema: SchemaObjectWithNullable | ReferenceObject,
  context: VisitorContext,
) => { type: IRType | null; models: IRModel[] };

/**
 * contentフィールド（MIMEタイプとMediaTypeObjectのマップ）を訪問
 *
 * @param content - contentオブジェクト（例: { "application/json": { schema: {...} } }）
 * @param context - 親コンテキスト
 * @param visitSchema - スキーマ訪問関数（再帰用）
 * @returns ContentTraversalResult
 *
 * @example OpenAPI YAML
 * ```yaml
 * content:
 *   application/json:
 *     schema:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *   application/xml:
 *     schema:
 *       type: string
 * ```
 */
export function traverseContent(
  content:
    | {
        [media: string]: {
          schema?: SchemaObject | ReferenceObject;
          example?: unknown;
          examples?: unknown;
          encoding?: unknown;
        };
      }
    | undefined,
  context: VisitorContext,
  visitSchema: VisitSchemaFn,
): ContentTraversalResult {
  // contentが未定義または空の場合
  if (!content || Object.keys(content).length === 0) {
    return {
      content: [],
      childModels: [],
      requiresSpecialModel: false,
    };
  }

  const visitedContent: ContentTraversalResult["content"] = [];
  const allChildModels: IRModel[] = [];
  let hasInlineObject = false;

  // 各MIMEタイプを訪問
  Object.entries(content).forEach(([mimeType, mediaTypeObject]) => {
    const schema = mediaTypeObject.schema;

    // schemaが存在しない場合はスキップ
    if (!schema) {
      consola.debug(
        `No schema found for mimeType: ${mimeType} at ${buildReferencePath(context.documentPath)}`,
      );
      return;
    }

    // スキーマコンテキストを作成
    // requestBody内のスキーマの場合はRequestBodyContextとして作成
    let schemaContext: VisitorContext;
    if (
      context.documentPath.includes("requestBody") &&
      context.rootSegment === "paths"
    ) {
      schemaContext = {
        kind: "requestBody",
        documentPath: [...context.documentPath, "content", mimeType, "schema"],
        rootSegment: "paths",
        contentType: mimeType as MimeType,
        schemaPath: ["content", mimeType, "schema"],
        // 親コンテキストからrequiredを継承
        ...("required" in context &&
          context.required !== undefined && { required: context.required }),
      } as PathsRequestBodyContext;
    } else if (
      context.documentPath.some((p) => p === "requestBodies") &&
      context.rootSegment === "components"
    ) {
      schemaContext = {
        kind: "componentsRequestBody",
        documentPath: [...context.documentPath, "content", mimeType, "schema"],
        rootSegment: "components",
        contentType: mimeType as MimeType,
        schemaPath: ["content", mimeType, "schema"],
        // 親コンテキストからrequiredを継承
        ...("required" in context &&
          context.required !== undefined && { required: context.required }),
      } as ComponentsRequestBodyContext;
    } else if (
      context.documentPath.some((p) => p === "responses") &&
      context.rootSegment === "paths"
    ) {
      // response内のスキーマの場合はResponseContextとして作成
      schemaContext = {
        kind: "response",
        documentPath: [...context.documentPath, "content", mimeType, "schema"],
        rootSegment: "paths",
        contentType: mimeType as MimeType,
        schemaPath: ["content", mimeType, "schema"],
        // 親コンテキストからheadersを継承
        ...("headers" in context && context.headers
          ? { headers: context.headers }
          : {}),
      } as PathsResponseContext;
    } else if (
      context.documentPath.some((p) => p === "responses") &&
      context.rootSegment === "components"
    ) {
      schemaContext = {
        kind: "componentsResponse",
        documentPath: [...context.documentPath, "content", mimeType, "schema"],
        rootSegment: "components",
        contentType: mimeType as MimeType,
        schemaPath: ["content", mimeType, "schema"],
        // 親コンテキストからheadersを継承
        ...("headers" in context && context.headers
          ? { headers: context.headers }
          : {}),
      } as ComponentsResponseContext;
    } else {
      // その他の場合は基本的なVisitorContext
      schemaContext = {
        documentPath: [...context.documentPath, "content", mimeType, "schema"],
        rootSegment: context.rootSegment,
      };
    }

    // スキーマを訪問
    const result = visitSchema(schema, schemaContext);

    if (!result.type) {
      // MIMEタイプのスキーマ解決に失敗した場合はスキップ
      // エラーはvisitSchema内で既に報告済み
      return;
    }

    // インラインobjectスキーマの検出
    if ("type" in schema && schema.type === "object" && !("$ref" in schema)) {
      hasInlineObject = true;
    }

    visitedContent.push({
      mimeType,
      schema: result.type,
    });

    allChildModels.push(...result.models);
  });

  return {
    content: visitedContent,
    childModels: allChildModels,
    requiresSpecialModel: hasInlineObject,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("traverseContent", () => {
    it("should handle empty content", () => {
      const mockVisitSchema = vi.fn();

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post", "requestBody"],
        rootSegment: "paths",
      };

      const result = traverseContent({}, context, mockVisitSchema);

      expect(result.content).toEqual([]);
      expect(result.childModels).toEqual([]);
      expect(result.requiresSpecialModel).toBe(false);
      expect(mockVisitSchema).not.toHaveBeenCalled();
    });

    it("should handle undefined content", () => {
      const mockVisitSchema = vi.fn();

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post", "requestBody"],
        rootSegment: "paths",
      };

      const result = traverseContent(undefined, context, mockVisitSchema);

      expect(result.content).toEqual([]);
      expect(result.childModels).toEqual([]);
      expect(result.requiresSpecialModel).toBe(false);
      expect(mockVisitSchema).not.toHaveBeenCalled();
    });

    it("should process single mime type with primitive schema", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: "string",
        models: [],
      });

      const content = {
        "application/json": {
          schema: { type: "string" as const },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post", "requestBody"],
        rootSegment: "paths",
      };

      const result = traverseContent(content, context, mockVisitSchema);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        mimeType: "application/json",
        schema: "string",
      });
      expect(result.childModels).toEqual([]);
      expect(result.requiresSpecialModel).toBe(false);

      expect(mockVisitSchema).toHaveBeenCalledWith(
        { type: "string" },
        {
          kind: "requestBody",
          documentPath: [
            "paths",
            "/users",
            "post",
            "requestBody",
            "content",
            "application/json",
            "schema",
          ],
          rootSegment: "paths",
          contentType: "application/json",
          schemaPath: ["content", "application/json", "schema"],
        },
      );
    });

    it("should process multiple mime types", () => {
      const mockVisitSchema = vi
        .fn()
        .mockReturnValueOnce({
          type: { kind: "ref", name: "#/components/schemas/User" },
          models: [],
        })
        .mockReturnValueOnce({
          type: "string",
          models: [],
        });

      const content = {
        "application/json": {
          schema: { $ref: "#/components/schemas/User" },
        },
        "application/xml": {
          schema: { type: "string" as const },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "get", "responses", "200"],
        rootSegment: "paths",
      };

      const result = traverseContent(content, context, mockVisitSchema);

      expect(result.content).toHaveLength(2);
      expect(result.content[0]).toEqual({
        mimeType: "application/json",
        schema: { kind: "ref", name: "#/components/schemas/User" },
      });
      expect(result.content[1]).toEqual({
        mimeType: "application/xml",
        schema: "string",
      });
      expect(result.requiresSpecialModel).toBe(false);
    });

    it("should detect inline object schema and set requiresSpecialModel flag", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: { kind: "ref", name: "#/test" },
        models: [],
      });

      const content = {
        "application/json": {
          schema: {
            type: "object" as const,
            properties: {
              name: { type: "string" as const },
            },
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post", "requestBody"],
        rootSegment: "paths",
      };

      const result = traverseContent(content, context, mockVisitSchema);

      expect(result.requiresSpecialModel).toBe(true);
      expect(result.content).toHaveLength(1);
    });

    it("should skip mime type without schema", () => {
      const mockVisitSchema = vi.fn();

      const content = {
        "application/json": {
          example: { name: "test" },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post", "requestBody"],
        rootSegment: "paths",
      };

      const result = traverseContent(content, context, mockVisitSchema);

      expect(result.content).toEqual([]);
      expect(mockVisitSchema).not.toHaveBeenCalled();
    });

    it("should skip mime type when schema resolution fails", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: null,
        models: [],
      });

      const content = {
        "application/json": {
          schema: { type: "invalid" as const },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post", "requestBody"],
        rootSegment: "paths",
      };

      const result = traverseContent(content, context, mockVisitSchema);

      expect(result.content).toEqual([]);
      expect(result.childModels).toEqual([]);
      expect(mockVisitSchema).toHaveBeenCalled();
    });

    it("should collect child models from schema resolution", () => {
      const mockModel: IRModel = {
        kind: "object",
        name: "NestedModel",
        referencePath: "#/test",
        properties: [],
      };

      const mockVisitSchema = vi.fn().mockReturnValue({
        type: { kind: "ref", name: "#/test" },
        models: [mockModel],
      });

      const content = {
        "application/json": {
          schema: {
            type: "object" as const,
            properties: { nested: { type: "object" as const } },
          },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post", "requestBody"],
        rootSegment: "paths",
      };

      const result = traverseContent(content, context, mockVisitSchema);

      expect(result.childModels).toHaveLength(1);
      expect(result.childModels[0]).toBe(mockModel);
    });

    it("should not set requiresSpecialModel for ref schema", () => {
      const mockVisitSchema = vi.fn().mockReturnValue({
        type: { kind: "ref", name: "#/components/schemas/User" },
        models: [],
      });

      const content = {
        "application/json": {
          schema: { $ref: "#/components/schemas/User" },
        },
      };

      const context: VisitorContext = {
        documentPath: ["paths", "/users", "post", "requestBody"],
        rootSegment: "paths",
      };

      const result = traverseContent(content, context, mockVisitSchema);

      expect(result.requiresSpecialModel).toBe(false);
    });
  });
}
