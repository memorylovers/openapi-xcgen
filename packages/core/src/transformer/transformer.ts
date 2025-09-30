/**
 * transformer.ts - OpenAPIDocumentをIRDocumentに変換
 *
 * OpenAPIドキュメント全体を処理し、中間表現（IR）に変換する。
 *
 * 責務:
 * - OpenAPIDocumentのバリデーション
 * - componentsの処理（visitComponentsに委譲）
 * - pathsの処理（visitPathsに委譲）
 * - IRDocumentの生成と統合
 */

import { consola } from "consola";
import type {
  ComponentsObject,
  IREndpoint,
  IRMetadata,
  IRModel,
  IRRequestBody,
  IRResponse,
  IRSecurityRequirement,
  IRSecurityScheme,
  IRTag,
  OpenAPIDocument,
  PathsObject,
  XcgenIR,
} from "../types";
import {
  visitComponents,
  visitMetadata,
  visitPaths,
  visitTags,
} from "./visitors";

/**
 * OpenAPIDocumentをXcgenIRに変換
 *
 * @param document - OpenAPIドキュメント
 * @returns XcgenIR
 *
 * @example
 * ```typescript
 * const doc: OpenAPIDocument = {
 *   openapi: "3.1.0",
 *   info: { title: "Pet Store API", version: "1.0.0" },
 *   paths: { ... },
 *   components: { schemas: { ... } }
 * };
 * const ir = transform(doc);
 * ```
 */
export function transform(document: OpenAPIDocument): XcgenIR {
  // OpenAPIバージョンチェック
  if (!document.openapi || !document.openapi.startsWith("3.")) {
    throw new Error(`Unsupported OpenAPI version: ${document.openapi}`);
  }

  // info必須チェック
  if (!document.info || !document.info.title || !document.info.version) {
    throw new Error("Missing required info field");
  }

  // 未対応機能の検出と警告
  if (document.components?.parameters) {
    consola.warn(
      `components.parameters is not supported yet and will be skipped`,
    );
  }

  // Components処理（schemas, securitySchemes, responses, requestBodies）
  let models: IRModel[] = [];
  let securitySchemes: Record<string, IRSecurityScheme> | undefined;
  let commonResponses: Record<string, IRResponse> | undefined;
  let commonRequestBodies: Record<string, IRRequestBody> | undefined;
  if (document.components) {
    // OpenAPIV3とOpenAPIV3_1の両方に対応するためキャスト
    const componentsResult = visitComponents(
      document.components as ComponentsObject,
      { documentPath: ["components"], rootSegment: "components" },
    );
    models = componentsResult.models;
    securitySchemes = componentsResult.securitySchemes;
    commonResponses = componentsResult.responses;
    commonRequestBodies = componentsResult.requestBodies;
  }

  // Tags処理
  const tags: IRTag[] = visitTags(document.tags);

  // Paths処理（endpoints）
  let endpoints: IREndpoint[] = [];
  if (document.paths) {
    // OpenAPIV3とOpenAPIV3_1の両方に対応するためキャスト
    const pathsResult = visitPaths(document.paths as PathsObject, {
      documentPath: ["paths"],
      rootSegment: "paths",
    });
    endpoints = pathsResult.endpoints;
    // インラインスキーマから抽出されたモデルを追加
    models.push(...pathsResult.models);
  }

  // 重複検出と警告（name + kindの組み合わせで判定）
  const modelKeys = new Set<string>();
  const duplicates = new Set<string>();

  // モデルのname + kindをチェック（オブジェクト、列挙型等を統一的に処理）
  models.forEach((item) => {
    const modelKey = `${item.kind}:${item.name}`;
    if (modelKeys.has(modelKey)) {
      duplicates.add(item.name);
    }
    modelKeys.add(modelKey);
  });

  // 重複があれば警告
  if (duplicates.size > 0) {
    const duplicateNames = [...duplicates].sort().join(", ");
    consola.warn(`Duplicate component names detected: ${duplicateNames}`);
  }

  // グローバルセキュリティ処理（ルートレベルのsecurity）
  let globalSecurity: IRSecurityRequirement[] | undefined;
  if (document.security) {
    globalSecurity = document.security.map((requirement) => {
      // SecurityRequirementObjectは { schemeName: scopes[] } の形式
      const schemeName = Object.keys(requirement)[0];
      const scopes = requirement[schemeName];
      return {
        scheme: schemeName,
        ...(scopes && scopes.length > 0 && { scopes }),
      };
    });
  }

  // XcgenIR生成
  const metadata: IRMetadata = visitMetadata(document.info);

  const xcgenIR: XcgenIR = {
    metadata,
    models,
    tags,
    endpoints,
    ...(securitySchemes && { securitySchemes }),
    ...(globalSecurity && { globalSecurity }),
    ...(commonResponses && { commonResponses }),
    ...(commonRequestBodies && { commonRequestBodies }),
  };

  return xcgenIR;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect, vi } = import.meta.vitest;

  describe("transform", () => {
    it("should transform minimal OpenAPI document", () => {
      const doc: OpenAPIDocument = {
        openapi: "3.1.0",
        info: {
          title: "Test API",
          version: "1.0.0",
        },
        paths: {},
      };

      const result = transform(doc);

      expect(result).toEqual({
        metadata: {
          title: "Test API",
          version: "1.0.0",
        },
        models: [],
        tags: [],
        endpoints: [],
      });
    });

    it("should transform document with components", () => {
      const doc: OpenAPIDocument = {
        openapi: "3.1.0",
        info: {
          title: "Pet Store API",
          version: "1.0.0",
          description: "A sample API",
        },
        paths: {},
        components: {
          schemas: {
            Pet: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
              },
              required: ["id", "name"],
            },
            Status: {
              type: "string",
              enum: ["available", "pending", "sold"],
            },
          },
        },
      };

      const result = transform(doc);

      expect(result).toEqual({
        metadata: {
          title: "Pet Store API",
          version: "1.0.0",
          description: "A sample API",
        },
        models: [
          {
            kind: "object",
            name: "Pet",
            referencePath: "#/components/schemas/Pet",

            properties: [
              {
                name: "id",
                type: "int",
                required: true,
              },
              {
                name: "name",
                type: "string",
                required: true,
              },
            ],
          },
          {
            kind: "enum",
            name: "Status",
            referencePath: "#/components/schemas/Status",
            type: "string",
            values: [
              { value: "available", name: "AVAILABLE" },
              { value: "pending", name: "PENDING" },
              { value: "sold", name: "SOLD" },
            ],
          },
        ],
        tags: [],
        endpoints: [],
      });
    });

    it("should transform document with paths", () => {
      const doc: OpenAPIDocument = {
        openapi: "3.1.0",
        info: {
          title: "Pet Store API",
          version: "1.0.0",
        },
        paths: {
          "/pets": {
            get: {
              operationId: "listPets",
              tags: ["pets"],
              responses: {
                "200": {
                  description: "Success",
                },
              },
            },
            post: {
              operationId: "createPet",
              tags: ["pets"],
              requestBody: {
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
              responses: {
                "201": {
                  description: "Created",
                },
              },
            },
          },
          "/users": {
            get: {
              operationId: "listUsers",
              tags: ["users"],
              responses: {
                "200": {
                  description: "Success",
                },
              },
            },
          },
        },
      };

      const result = transform(doc);

      expect(result).toEqual({
        metadata: {
          title: "Pet Store API",
          version: "1.0.0",
        },
        models: [
          {
            kind: "requestBody",
            name: "PostPetsRequestBody",
            referencePath:
              "#/paths/::pets/post/requestBody/content/application::json/schema/PostPetsRequestBody",
            properties: [
              {
                name: "name",
                type: "string",
              },
            ],
          },
        ],
        tags: [],
        endpoints: [
          {
            operationId: "listPets",
            method: "get",
            path: "/pets",
            tags: ["pets"],
            parameters: [],
            responses: [
              {
                kind: "content",
                statusCode: "200",
                description: "Success",
              },
            ],
          },
          {
            operationId: "createPet",
            method: "post",
            path: "/pets",
            tags: ["pets"],
            parameters: [],
            requestBody: {
              kind: "content",
              content: [
                {
                  mimeType: "application/json",
                  schema: {
                    kind: "ref",
                    name: "#/paths/::pets/post/requestBody/content/application::json/schema/PostPetsRequestBody",
                  },
                },
              ],
            },
            responses: [
              {
                kind: "content",
                statusCode: "201",
                description: "Created",
              },
            ],
          },
          {
            operationId: "listUsers",
            method: "get",
            path: "/users",
            tags: ["users"],
            parameters: [],
            responses: [
              {
                kind: "content",
                statusCode: "200",
                description: "Success",
              },
            ],
          },
        ],
      });
    });

    it("should transform complete document", () => {
      const doc: OpenAPIDocument = {
        openapi: "3.1.0",
        info: {
          title: "Complete API",
          version: "2.0.0",
          description: "A complete example",
        },
        paths: {
          "/pets/{id}": {
            get: {
              operationId: "getPet",
              tags: ["pets"],
              parameters: [
                {
                  name: "id",
                  in: "path",
                  required: true,
                  schema: { type: "string" },
                },
              ],
              responses: {
                "200": {
                  description: "Success",
                  content: {
                    "application/json": {
                      schema: {
                        $ref: "#/components/schemas/Pet",
                      },
                    },
                  },
                },
                "404": {
                  description: "Not found",
                },
              },
            },
          },
        },
        components: {
          schemas: {
            Pet: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                status: {
                  type: "string",
                  enum: ["available", "pending", "sold"],
                },
              },
            },
          },
        },
      };

      const result = transform(doc);

      expect(result).toEqual({
        metadata: {
          title: "Complete API",
          version: "2.0.0",
          description: "A complete example",
        },
        models: [
          {
            kind: "object",
            name: "Pet",
            referencePath: "#/components/schemas/Pet",
            properties: [
              {
                name: "id",
                type: "string",
              },
              {
                name: "name",
                type: "string",
              },
              {
                name: "status",
                type: {
                  kind: "ref",
                  name: "#/components/schemas/PetStatus",
                },
              },
            ],
          },
          {
            kind: "enum",
            name: "PetStatus",
            referencePath: "#/components/schemas/PetStatus",
            type: "string",
            values: [
              { value: "available", name: "AVAILABLE" },
              { value: "pending", name: "PENDING" },
              { value: "sold", name: "SOLD" },
            ],
          },
          {
            kind: "parameter",
            name: "GetPetsIdParams",
            referencePath:
              "#/paths/::pets::{id}/get/parameters/GetPetsIdParams",
            description: "Parameters for GET /pets/{id}",
            properties: [
              {
                name: "id",
                type: "string",
                required: true,
                in: "path",
              },
            ],
          },
        ],
        tags: [],
        endpoints: [
          {
            operationId: "getPet",
            method: "get",
            path: "/pets/{id}",
            tags: ["pets"],
            parameters: {
              kind: "ref",
              name: "#/paths/::pets::{id}/get/parameters/GetPetsIdParams",
            },
            responses: [
              {
                kind: "content",
                statusCode: "200",
                description: "Success",
                content: [
                  {
                    mimeType: "application/json",
                    schema: {
                      kind: "ref",
                      name: "#/components/schemas/Pet",
                    },
                  },
                ],
              },
              {
                kind: "content",
                statusCode: "404",
                description: "Not found",
              },
            ],
          },
        ],
      });
    });

    it("should throw error for unsupported OpenAPI version", () => {
      const doc = {
        openapi: "2.0",
        info: {
          title: "Test",
          version: "1.0.0",
        },
      } as unknown as OpenAPIDocument;

      expect(() => transform(doc)).toThrow("Unsupported OpenAPI version: 2.0");
    });

    it("should throw error for missing info", () => {
      const doc = {
        openapi: "3.1.0",
      } as unknown as OpenAPIDocument;

      expect(() => transform(doc)).toThrow("Missing required info field");
    });

    it("should throw error for missing info.title", () => {
      const doc = {
        openapi: "3.1.0",
        info: {
          version: "1.0.0",
        },
      } as unknown as OpenAPIDocument;

      expect(() => transform(doc)).toThrow("Missing required info field");
    });

    it("should handle document without components or paths", () => {
      const doc: OpenAPIDocument = {
        openapi: "3.0.3",
        info: {
          title: "Empty API",
          version: "1.0.0",
        },
        paths: {},
      };

      const result = transform(doc);

      expect(result).toEqual({
        metadata: {
          title: "Empty API",
          version: "1.0.0",
        },
        models: [],
        tags: [],
        endpoints: [],
      });
    });
  });

  describe("Duplicate Detection", () => {
    it("should not warn when no duplicates exist", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const doc: OpenAPIDocument = {
        openapi: "3.1.0",
        info: {
          title: "No Duplicates API",
          version: "1.0.0",
        },
        components: {
          schemas: {
            User: {
              type: "object",
              properties: { id: { type: "string" } },
            },
            Status: {
              type: "string",
              enum: ["active", "inactive"],
            },
          },
        },
        paths: {
          "/orders": {
            post: {
              operationId: "createOrder",
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { total: { type: "number" } },
                    },
                  },
                },
              },
              responses: { "200": { description: "Created" } },
            },
          },
        },
      };

      transform(doc);

      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it("should not warn when same names exist for different kinds", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const doc: OpenAPIDocument = {
        openapi: "3.1.0",
        info: {
          title: "Same Name Different Kinds API",
          version: "1.0.0",
        },
        components: {
          schemas: {
            UserRequest: {
              type: "object",
              properties: { id: { type: "string" } },
            },
          },
        },
        paths: {
          "/users": {
            post: {
              operationId: "createUser",
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { name: { type: "string" } },
                    },
                  },
                },
              },
              responses: {
                "200": {
                  description: "Created",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: { result: { type: "string" } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      transform(doc);

      // Should not warn because different model kinds can have same names:
      // - object kind (from components.schemas): UserRequest
      // - object kind (from inline schemas): PostUsersRequestBody, PostUsers200Response
      // - requestBody kind (unified model): PostUsersRequestBody
      // - response kind (unified model): PostUsers200Response
      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it("should not warn when using $ref to avoid duplicates", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const doc: OpenAPIDocument = {
        openapi: "3.1.0",
        info: {
          title: "No Duplicate Models API",
          version: "1.0.0",
        },
        components: {
          schemas: {
            UserRequestBody: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
              },
            },
          },
        },
        paths: {
          "/users": {
            post: {
              operationId: "createUser",
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/UserRequestBody",
                    },
                  },
                },
              },
              responses: { "200": { description: "Created" } },
            },
          },
        },
      };

      transform(doc);

      // Should NOT warn because using $ref properly avoids naming conflicts
      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it("should warn when enum duplicates exist", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const doc: OpenAPIDocument = {
        openapi: "3.1.0",
        info: {
          title: "Duplicate Enums API",
          version: "1.0.0",
        },
        components: {
          schemas: {
            PostUsersRequestBodyStatus: {
              type: "string",
              enum: ["pending", "processing"],
            },
          },
        },
        paths: {
          "/users": {
            post: {
              operationId: "createUser",
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        status: {
                          type: "string",
                          enum: ["active", "inactive"],
                        },
                      },
                    },
                  },
                },
              },
              responses: {
                "200": { description: "Success" },
              },
            },
          },
        },
      };

      transform(doc);

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        "Duplicate component names detected: PostUsersRequestBodyStatus",
      );

      warnSpy.mockRestore();
    });

    it("should handle separate inline schemas without naming conflicts", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const doc: OpenAPIDocument = {
        openapi: "3.1.0",
        info: {
          title: "Separate Models API",
          version: "1.0.0",
        },
        components: {
          schemas: {
            UserProfile: {
              type: "object",
              properties: { bio: { type: "string" } },
            },
          },
        },
        paths: {
          "/users": {
            get: {
              operationId: "getUsers",
              parameters: [
                {
                  name: "limit",
                  in: "query",
                  schema: { type: "integer" },
                },
              ],
              responses: { "200": { description: "Success" } },
            },
            post: {
              operationId: "createUser",
              requestBody: {
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
              },
              responses: { "200": { description: "Created" } },
            },
          },
        },
      };

      transform(doc);

      // Should NOT warn because components and inline schemas have different names
      // - UserProfile (from components)
      // - PostUsersRequestBody (generated from inline)
      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it("should process components.securitySchemes", () => {
      const doc: OpenAPIDocument = {
        openapi: "3.0.0",
        info: {
          title: "API with Security",
          version: "1.0.0",
        },
        paths: {
          "/secure": {
            get: {
              responses: { "200": { description: "OK" } },
            },
          },
        },
        components: {
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
        },
      };

      const result = transform(doc);

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

    it("should process root-level security as globalSecurity", () => {
      const doc: OpenAPIDocument = {
        openapi: "3.0.0",
        info: {
          title: "API with Global Security",
          version: "1.0.0",
        },
        paths: {
          "/secure": {
            get: {
              responses: { "200": { description: "OK" } },
            },
          },
        },
        components: {
          securitySchemes: {
            OAuth2: {
              type: "oauth2",
              flows: {
                authorizationCode: {
                  authorizationUrl: "https://auth.example.com/oauth/authorize",
                  tokenUrl: "https://auth.example.com/oauth/token",
                  scopes: {
                    read: "Read access",
                    write: "Write access",
                  },
                },
              },
            },
          },
        },
        security: [
          {
            OAuth2: [],
          },
        ],
      };

      const result = transform(doc);

      expect(result.globalSecurity).toEqual([
        {
          scheme: "OAuth2",
        },
      ]);
    });

    it("should process root-level security with scopes", () => {
      const doc: OpenAPIDocument = {
        openapi: "3.0.0",
        info: {
          title: "API with Scoped Global Security",
          version: "1.0.0",
        },
        paths: {
          "/secure": {
            get: {
              responses: { "200": { description: "OK" } },
            },
          },
        },
        components: {
          securitySchemes: {
            OAuth2: {
              type: "oauth2",
              flows: {
                authorizationCode: {
                  authorizationUrl: "https://auth.example.com/oauth/authorize",
                  tokenUrl: "https://auth.example.com/oauth/token",
                  scopes: {
                    read: "Read access",
                    write: "Write access",
                  },
                },
              },
            },
          },
        },
        security: [
          {
            OAuth2: ["read", "write"],
          },
        ],
      };

      const result = transform(doc);

      expect(result.globalSecurity).toEqual([
        {
          scheme: "OAuth2",
          scopes: ["read", "write"],
        },
      ]);
    });

    it("should not include globalSecurity when no root-level security exists", () => {
      const doc: OpenAPIDocument = {
        openapi: "3.0.0",
        info: {
          title: "API without Global Security",
          version: "1.0.0",
        },
        paths: {
          "/public": {
            get: {
              responses: { "200": { description: "OK" } },
            },
          },
        },
      };

      const result = transform(doc);

      expect(result.globalSecurity).toBeUndefined();
    });
  });
}
