/**
 * components-transformer.ts - ComponentsObjectを処理してmodels/securitySchemes等に分類
 *
 * 責務:
 * - components.schemasの処理（dispatchSchemaに委譲）
 * - components.securitySchemesの処理
 * - components.responsesの処理
 * - components.requestBodiesの処理
 */

import { consola } from "consola";
import type {
  ComponentsObject,
  IRModel,
  IRRequestBody,
  IRResponse,
  IRSecurityScheme,
  RequestBodyObject,
  ResponseObject,
  SchemaObjectWithNullable,
} from "../../../types";
import { isReferenceObject } from "../../../types";
import type { TransformContext } from "../context";
import { dispatchSchema } from "../dispatchers/schema-dispatcher";
import { traverseComponentSchemas } from "../traversers/component-schemas-traverser";
import { traverseContent } from "../traversers/content-traverser";
import { traverseHeaders } from "../traversers/headers-traverser";
import { transformRequestBody } from "./request-body-transformer";
import { transformResponse } from "./response-transformer";
import { transformSecuritySchemes } from "./security-schemes-transformer";

/**
 * Components処理の結果
 */
export interface ComponentsTransformResult {
  /** 抽出されたモデル（オブジェクト、列挙型、配列、マップを統一的に管理） */
  models: IRModel[];
  /** セキュリティスキーム定義 */
  securitySchemes?: Record<string, IRSecurityScheme>;
  /** 共通レスポンス定義 */
  responses?: Record<string, IRResponse>;
  /** 共通リクエストボディ定義 */
  requestBodies?: Record<string, IRRequestBody>;
}

/**
 * ComponentsObjectを処理してモデル/セキュリティスキーム等に変換
 *
 * @param components - OpenAPIのComponentsObject
 * @param context - 変換コンテキスト
 * @returns 統一されたモデル配列とセキュリティスキーム等
 *
 * @example OpenAPI YAML
 * ```yaml
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *     Status:
 *       type: string
 *       enum: [pending, approved, rejected]
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 * ```
 */
export function transformComponents(
  components: ComponentsObject,
  context: TransformContext,
): ComponentsTransformResult {
  const result: ComponentsTransformResult = {
    models: [],
  };

  // securitySchemesを処理
  if (components.securitySchemes) {
    const securitySchemes = transformSecuritySchemes(
      components.securitySchemes,
    );
    if (Object.keys(securitySchemes).length > 0) {
      result.securitySchemes = securitySchemes;
    }
  }

  // components.responsesを処理
  if (components.responses) {
    const responses: Record<string, IRResponse> = {};
    for (const [name, response] of Object.entries(components.responses)) {
      // ReferenceObjectの場合は警告してスキップ（ネストされた$refは未対応）
      if (isReferenceObject(response)) {
        consola.warn(
          `Nested $ref in components.responses["${name}"] is not supported`,
        );
        continue;
      }

      const responseObj = response as ResponseObject;
      const responseContext: TransformContext = {
        documentPath: ["components", "responses", name],
        rootSegment: "components",
      };

      // contentとheadersをtraverse
      const contentResult = responseObj.content
        ? traverseContent(responseObj.content, responseContext, dispatchSchema)
        : undefined;
      const headersResult = responseObj.headers
        ? traverseHeaders(responseObj.headers, responseContext, dispatchSchema)
        : undefined;

      // transformResponseを呼び出し（statusCodeは空文字列）
      const responseResult = transformResponse(
        responseObj,
        "", // components.responsesではstatusCodeは不要
        responseContext,
        contentResult,
        headersResult,
      );

      if (responseResult.type) {
        responses[name] = responseResult.type as unknown as IRResponse;
        result.models.push(...responseResult.models);
      }
    }

    if (Object.keys(responses).length > 0) {
      result.responses = responses;
    }
  }

  // components.requestBodiesを処理
  if (components.requestBodies) {
    const requestBodies: Record<string, IRRequestBody> = {};
    for (const [name, requestBody] of Object.entries(
      components.requestBodies,
    )) {
      // ReferenceObjectの場合は警告してスキップ（ネストされた$refは未対応）
      if (isReferenceObject(requestBody)) {
        consola.warn(
          `Nested $ref in components.requestBodies["${name}"] is not supported`,
        );
        continue;
      }

      const requestBodyObj = requestBody as RequestBodyObject;
      const requestBodyContext: TransformContext = {
        documentPath: ["components", "requestBodies", name],
        rootSegment: "components",
      };

      // contentをtraverse
      const contentResult = requestBodyObj.content
        ? traverseContent(
            requestBodyObj.content,
            requestBodyContext,
            dispatchSchema,
          )
        : { content: [], childModels: [], requiresSpecialModel: false };

      // transformRequestBodyを呼び出し
      const requestBodyResult = transformRequestBody(
        requestBodyObj,
        requestBodyContext,
        contentResult,
      );

      if (requestBodyResult.type) {
        requestBodies[name] =
          requestBodyResult.type as unknown as IRRequestBody;
        result.models.push(...requestBodyResult.models);
      }
    }

    if (Object.keys(requestBodies).length > 0) {
      result.requestBodies = requestBodies;
    }
  }

  // schemasが存在する場合は処理
  if (components.schemas) {
    // traverseComponentSchemasを呼び出し
    const schemasResult = traverseComponentSchemas(
      components.schemas,
      context,
      dispatchSchema,
    );
    result.models.push(...schemasResult.models);
  }

  return result;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("transformComponents", () => {
    it("should extract models from schemas", () => {
      const components: ComponentsObject = {
        schemas: {
          Item: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["a", "b"] },
            },
          },
          Type: {
            type: "string",
            enum: ["x", "y"],
          },
        },
      };

      const result = transformComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      expect(result.models).toHaveLength(3); // Item object + 2 enums
      expect(result.models[0].kind).toBe("object");
      expect(result.models[0].name).toBe("Item");
      expect(result.models[1].kind).toBe("enum");
      expect(result.models[2].kind).toBe("enum");
    });

    it("should handle empty components.schemas", () => {
      const components: ComponentsObject = { schemas: {} };
      const result = transformComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      expect(result.models).toEqual([]);
    });

    it("should handle null or missing schemas", () => {
      const componentsWithoutSchemas: ComponentsObject = {};
      const result = transformComponents(componentsWithoutSchemas, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      expect(result).toEqual({
        models: [],
      });
    });

    it("should warn and skip invalid schemas", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const components = {
        schemas: {
          Invalid: null as unknown as SchemaObjectWithNullable,
          Valid: { type: "string", enum: ["a", "b"] },
        },
      } as ComponentsObject;

      const result = transformComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid schema"),
      );
      expect(result.models.length).toEqual(1); // Valid enum only

      warnSpy.mockRestore();
    });

    it("should process securitySchemes", () => {
      const components: ComponentsObject = {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
          ApiKey: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key",
          },
        },
      };

      const result = transformComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      expect(result.securitySchemes).toEqual({
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        ApiKey: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
      });
    });

    it("should handle error in dispatchSchema gracefully", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const components: ComponentsObject = {
        schemas: {
          BadSchema: {
            type: "invalid_type",
          } as unknown as SchemaObjectWithNullable,
          GoodSchema: { type: "string", enum: ["a", "b"] },
        },
      };

      const result = transformComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      // GoodSchemaは正常に処理される
      expect(result.models.length).toBeGreaterThan(0);

      warnSpy.mockRestore();
    });

    it("should process components.responses", () => {
      const components: ComponentsObject = {
        responses: {
          BadRequest: {
            description: "Bad request error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                  },
                },
              },
            },
          },
          NotFound: {
            description: "Resource not found",
          },
        },
      };

      const result = transformComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      expect(result.responses).toBeDefined();
      expect(Object.keys(result.responses!)).toHaveLength(2);
      expect(result.responses!.BadRequest).toBeDefined();
      expect(result.responses!.BadRequest.kind).toBe("content");
      if (result.responses!.BadRequest.kind === "content") {
        expect(result.responses!.BadRequest.description).toBe(
          "Bad request error",
        );
      }
      expect(result.responses!.NotFound).toBeDefined();
      if (result.responses!.NotFound.kind === "content") {
        expect(result.responses!.NotFound.description).toBe(
          "Resource not found",
        );
      }
    });

    it("should process components.requestBodies", () => {
      const components: ComponentsObject = {
        requestBodies: {
          UserRequest: {
            description: "User creation request",
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                  },
                },
              },
            },
          },
        },
      };

      const result = transformComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      expect(result.requestBodies).toBeDefined();
      expect(Object.keys(result.requestBodies!)).toHaveLength(1);
      expect(result.requestBodies!.UserRequest).toBeDefined();
      expect(result.requestBodies!.UserRequest.kind).toBe("content");
    });

    it("should warn and skip nested $ref in components.responses", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const components = {
        responses: {
          ValidResponse: {
            description: "Valid response",
          },
          InvalidRef: {
            $ref: "#/components/responses/SomeOtherResponse",
          },
        },
      } as ComponentsObject;

      const result = transformComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Nested $ref in components.responses["InvalidRef"]',
        ),
      );
      expect(result.responses).toBeDefined();
      expect(Object.keys(result.responses!)).toHaveLength(1);
      expect(result.responses!.ValidResponse).toBeDefined();

      warnSpy.mockRestore();
    });

    it("should warn and skip nested $ref in components.requestBodies", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const components = {
        requestBodies: {
          ValidRequestBody: {
            description: "Valid request body",
            content: {
              "application/json": {
                schema: { type: "object" },
              },
            },
          },
          InvalidRef: {
            $ref: "#/components/requestBodies/SomeOtherRequestBody",
          },
        },
      } as ComponentsObject;

      const result = transformComponents(components, {
        documentPath: ["components"],
        rootSegment: "components",
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Nested $ref in components.requestBodies["InvalidRef"]',
        ),
      );
      expect(result.requestBodies).toBeDefined();
      expect(Object.keys(result.requestBodies!)).toHaveLength(1);
      expect(result.requestBodies!.ValidRequestBody).toBeDefined();

      warnSpy.mockRestore();
    });
  });
}
