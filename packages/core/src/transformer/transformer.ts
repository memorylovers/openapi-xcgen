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

  // Components処理（schemas）
  let models: IRModel[] = [];
  if (document.components?.schemas) {
    // OpenAPIV3とOpenAPIV3_1の両方に対応するためキャスト
    const componentsResult = visitComponents(
      document.components as ComponentsObject,
      { documentPath: ["components", "schemas"], rootSegment: "components" },
    );
    models = componentsResult.models;
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
    // デバッグ用：モデルキー出力
    // consola.debug(`Checking model: ${modelKey}`);
    if (modelKeys.has(modelKey)) {
      duplicates.add(item.name);
    }
    modelKeys.add(modelKey);
  });

  // 重複があれば警告
  if (duplicates.size > 0) {
    duplicates.forEach((name) => {
      consola.warn(`Duplicate component name detected: "${name}"`);
    });
    consola.warn(
      `Consider reviewing your OpenAPI design for naming conflicts.`,
    );
    consola.warn(
      `Components with duplicate names may cause issues in code generation.`,
    );
  }

  // XcgenIR生成
  const metadata: IRMetadata = visitMetadata(document.info);

  const xcgenIR: XcgenIR = {
    metadata,
    models,
    tags,
    endpoints,
    servers: [],
    security: [],
  };

  // 統計情報をログ出力（種類別にカウント）
  const objectCount = models.filter((m) => m.kind === "object").length;
  const enumCount = models.filter((m) => m.kind === "enum").length;
  const arrayCount = models.filter((m) => m.kind === "array").length;
  const mapCount = models.filter((m) => m.kind === "map").length;
  const parameterCount = models.filter((m) => m.kind === "parameter").length;
  const requestBodyCount = models.filter(
    (m) => m.kind === "requestBody",
  ).length;
  const responseCount = models.filter((m) => m.kind === "response").length;

  consola.success(
    `Transformed OpenAPI document: ${models.length} models (${objectCount} objects, ${enumCount} enums, ${arrayCount} arrays, ${mapCount} maps, ${parameterCount} parameters, ${requestBodyCount} requestBodies, ${responseCount} responses), ${tags.length} tags, ${endpoints.length} endpoints`,
  );

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
        servers: [],
        security: [],
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
        servers: [],
        security: [],
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
                statusCode: "200",
                description: "Success",
              },
            ],
          },
        ],
        servers: [],
        security: [],
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
                statusCode: "404",
                description: "Not found",
              },
            ],
          },
        ],
        servers: [],
        security: [],
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
        servers: [],
        security: [],
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

      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("Duplicate component name detected"),
      );

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
      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("Duplicate component name detected"),
      );

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
      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("Duplicate component name detected"),
      );

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

      expect(warnSpy).toHaveBeenCalledWith(
        'Duplicate component name detected: "PostUsersRequestBodyStatus"',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        "Consider reviewing your OpenAPI design for naming conflicts.",
      );
      expect(warnSpy).toHaveBeenCalledWith(
        "Components with duplicate names may cause issues in code generation.",
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
      expect(warnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("Duplicate component name detected"),
      );

      warnSpy.mockRestore();
    });
  });
}
