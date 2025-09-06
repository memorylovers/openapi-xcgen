/**
 * request-body-visitor.ts - RequestBodyObjectをIRRequestBodyに変換
 *
 * OpenAPIのRequestBodyObject（リクエストボディ定義）を処理し、
 * IRRequestBodyに変換する。
 *
 * 責務:
 * - required、descriptionの処理
 * - contentのMIMEタイプごとのスキーマ処理（visitSchemaに委譲）
 * - $ref参照の解決（現時点では未実装）
 */

import { consola } from "consola";
import { isReferenceObject } from "../../types/guards";
import type { ReferenceObject, RequestBodyObject } from "../../types/index";
import type { IRContentMap, IRRequestBody } from "../../types/ir/index";
import type { VisitorContext } from "../types";
import { visitSchema } from "./schema-visitor";

/**
 * RequestBodyObjectをIRRequestBodyに変換
 *
 * @param requestBody - OpenAPIのRequestBodyObjectまたはReferenceObject
 * @param operationId - エンドポイントのoperationId（命名に使用）
 * @param context - Visitorコンテキスト
 * @returns IRRequestBody、または変換できない場合はnull
 *
 * @example OpenAPI YAML
 * ```yaml
 * requestBody:
 *   description: User data
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           name:
 *             type: string
 *           email:
 *             type: string
 *             format: email
 *         required: [name, email]
 *     application/xml:
 *       schema:
 *         type: object
 *         xml:
 *           name: user
 * ```
 */
export function visitRequestBody(
  requestBody: RequestBodyObject | ReferenceObject,
  operationId: string,
  context: VisitorContext,
): IRRequestBody | null {
  // $ref参照の場合は現時点でスキップ
  if (isReferenceObject(requestBody)) {
    consola.warn(
      `Reference requestBody not supported yet: ${requestBody.$ref}`,
    );
    return null;
  }

  // contentが必須
  if (!requestBody.content || Object.keys(requestBody.content).length === 0) {
    consola.warn(`RequestBody without content for operation: ${operationId}`);
    return null;
  }

  // contentの処理
  const content: IRContentMap = {};
  for (const [mimeType, mediaType] of Object.entries(requestBody.content)) {
    if (mediaType.schema) {
      const schemaResult = visitSchema(mediaType.schema, {
        documentPath: [...context.documentPath, "content", mimeType, "schema"],
      });
      if (schemaResult.type) {
        content[mimeType] = schemaResult.type;
      }
    }
  }

  // 空のcontentは返さない
  if (Object.keys(content).length === 0) {
    consola.warn(
      `No valid schemas in requestBody content for operation: ${operationId}`,
    );
    return null;
  }

  return {
    description: requestBody.description,
    required: requestBody.required || false,
    content,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("visitRequestBody", () => {
    it("should handle basic requestBody with JSON content", () => {
      const requestBody: RequestBodyObject = {
        description: "User data",
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
              },
            },
          },
        },
      };

      const result = visitRequestBody(requestBody, "createUser", {
        documentPath: ["paths", "/users", "post", "requestBody"],
      });

      expect(result).not.toBeNull();
      expect(result?.description).toBe("User data");
      expect(result?.required).toBe(true);
      expect(result?.content).toBeDefined();
      expect(result?.content?.["application/json"]).toBeDefined();
    });

    it("should handle requestBody with multiple content types", () => {
      const requestBody: RequestBodyObject = {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: { type: "string" },
              },
            },
          },
          "application/xml": {
            schema: {
              type: "object",
              properties: {
                data: { type: "string" },
              },
            },
          },
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                file: { type: "string", format: "binary" },
              },
            },
          },
        },
      };

      const result = visitRequestBody(requestBody, "uploadFile", {
        documentPath: ["paths", "/files", "post", "requestBody"],
      });

      expect(result?.required).toBe(false);
      expect(result?.content).toBeDefined();
      expect(Object.keys(result?.content || {})).toHaveLength(3);
      expect(result?.content?.["multipart/form-data"]).toBeDefined();
    });

    it("should warn and return null for requestBody without content", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const requestBody: RequestBodyObject = {
        description: "Empty body",
        required: true,
        // No content
      } as RequestBodyObject;

      const result = visitRequestBody(requestBody, "testOp", {
        documentPath: ["paths", "/test", "post", "requestBody"],
      });

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        "RequestBody without content for operation: testOp",
      );

      warnSpy.mockRestore();
    });

    it("should warn and return null for empty content object", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const requestBody: RequestBodyObject = {
        content: {},
      };

      const result = visitRequestBody(requestBody, "testOp", {
        documentPath: ["paths", "/test", "post", "requestBody"],
      });

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        "RequestBody without content for operation: testOp",
      );

      warnSpy.mockRestore();
    });

    it("should warn and return null for reference requestBody", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const requestBody: ReferenceObject = {
        $ref: "#/components/requestBodies/UserInput",
      };

      const result = visitRequestBody(requestBody, "updateUser", {
        documentPath: ["paths", "/users/{id}", "put", "requestBody"],
      });

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        "Reference requestBody not supported yet: #/components/requestBodies/UserInput",
      );

      warnSpy.mockRestore();
    });

    it("should handle content with media types that have no schema", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const requestBody: RequestBodyObject = {
        content: {
          "application/json": {
            // No schema
          },
          "text/plain": {
            schema: { type: "string" },
          },
        } as RequestBodyObject["content"],
      };

      const result = visitRequestBody(requestBody, "testOp", {
        documentPath: ["paths", "/test", "post", "requestBody"],
      });

      expect(result).not.toBeNull();
      expect(result?.content?.["text/plain"]).toBeDefined();
      expect(result?.content?.["application/json"]).toBeUndefined();

      warnSpy.mockRestore();
    });

    it("should default required to false when not specified", () => {
      const requestBody: RequestBodyObject = {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: { type: "string" },
              },
            },
          },
        },
      };

      const result = visitRequestBody(requestBody, "testOp", {
        documentPath: ["paths", "/test", "post", "requestBody"],
      });

      expect(result?.required).toBe(false);
    });
  });
}
