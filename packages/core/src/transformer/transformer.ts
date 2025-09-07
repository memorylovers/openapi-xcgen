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
  OpenAPIDocument,
  PathsObject,
} from "../types/index";
import type { IRDocument, IREnum, IRModel, IRService } from "../types/ir/index";
import { visitComponents } from "./visitors/components-visitor";
import { visitPaths } from "./visitors/paths-visitor";

/**
 * OpenAPIDocumentをIRDocumentに変換
 *
 * @param document - OpenAPIドキュメント
 * @returns IRDocument
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
export function transform(document: OpenAPIDocument): IRDocument {
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
  let enums: IREnum[] = [];
  if (document.components?.schemas) {
    // OpenAPIV3とOpenAPIV3_1の両方に対応するためキャスト
    const componentsResult = visitComponents(
      document.components as ComponentsObject,
      { documentPath: ["components", "schemas"] },
    );
    models = componentsResult.models;
    enums = componentsResult.enums;
  }

  // Paths処理（services/endpoints）
  let services: IRService[] = [];
  if (document.paths) {
    // OpenAPIV3とOpenAPIV3_1の両方に対応するためキャスト
    const pathsResult = visitPaths(document.paths as PathsObject, {
      documentPath: ["paths"],
    });
    services = pathsResult.services;
    // インラインスキーマから抽出されたモデルとEnumを追加
    models.push(...pathsResult.models);
    enums.push(...pathsResult.enums);
  }

  // 重複検出と警告
  const names = new Set<string>();
  const duplicates = new Set<string>();

  // モデルとEnumの名前をチェック
  [...models, ...enums].forEach((item) => {
    if (names.has(item.name)) {
      duplicates.add(item.name);
    }
    names.add(item.name);
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

  // IRDocument生成
  const irDocument: IRDocument = {
    info: {
      title: document.info.title,
      version: document.info.version,
      description: document.info.description,
    },
    models,
    enums,
    services,
  };

  // 統計情報をログ出力
  consola.success(
    `Transformed OpenAPI document: ${models.length} models, ${enums.length} enums, ${services.length} services`,
  );

  return irDocument;
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
        info: {
          title: "Test API",
          version: "1.0.0",
          description: undefined,
        },
        models: [],
        enums: [],
        services: [],
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

      expect(result.info).toEqual({
        title: "Pet Store API",
        version: "1.0.0",
        description: "A sample API",
      });
      expect(result.models).toHaveLength(1);
      expect(result.models[0].name).toBe("Pet");
      expect(result.enums).toHaveLength(1);
      expect(result.enums[0].name).toBe("Status");
      expect(result.services).toHaveLength(0);
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

      expect(result.services).toHaveLength(2);

      const petsService = result.services.find(
        (s: IRService) => s.name === "pets",
      );
      expect(petsService).toBeDefined();
      expect(petsService?.endpoints).toHaveLength(2);

      const usersService = result.services.find(
        (s: IRService) => s.name === "users",
      );
      expect(usersService).toBeDefined();
      expect(usersService?.endpoints).toHaveLength(1);
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

      expect(result.info.title).toBe("Complete API");
      expect(result.info.version).toBe("2.0.0");
      expect(result.models).toHaveLength(2); // Pet + GetPetsParams
      expect(result.enums).toHaveLength(1);
      expect(result.services).toHaveLength(1);
      expect(result.services[0].endpoints).toHaveLength(1);
      expect(result.services[0].endpoints[0].parameters).toHaveLength(1);
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

      expect(result.models).toEqual([]);
      expect(result.enums).toEqual([]);
      expect(result.services).toEqual([]);
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

    it("should warn when model duplicates exist", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const doc: OpenAPIDocument = {
        openapi: "3.1.0",
        info: {
          title: "Duplicate Models API",
          version: "1.0.0",
        },
        components: {
          schemas: {
            PostUsersRequestBody: {
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
              responses: { "200": { description: "Created" } },
            },
          },
        },
      };

      transform(doc);

      expect(warnSpy).toHaveBeenCalledWith(
        'Duplicate component name detected: "PostUsersRequestBody"',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        "Consider reviewing your OpenAPI design for naming conflicts.",
      );
      expect(warnSpy).toHaveBeenCalledWith(
        "Components with duplicate names may cause issues in code generation.",
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
            schemaStatus: {
              type: "string",
              enum: ["success", "failure"],
            },
          },
        },
        paths: {
          "/users": {
            post: {
              operationId: "createUser",
              responses: {
                "200": {
                  description: "Success",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          status: {
                            type: "string",
                            enum: ["active", "inactive"],
                          },
                        },
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

      expect(warnSpy).toHaveBeenCalledWith(
        'Duplicate component name detected: "schemaStatus"',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        "Consider reviewing your OpenAPI design for naming conflicts.",
      );
      expect(warnSpy).toHaveBeenCalledWith(
        "Components with duplicate names may cause issues in code generation.",
      );

      warnSpy.mockRestore();
    });

    it("should warn for multiple duplicates", () => {
      const warnSpy = vi.spyOn(consola, "warn").mockImplementation(() => {});

      const doc: OpenAPIDocument = {
        openapi: "3.1.0",
        info: {
          title: "Multiple Duplicates API",
          version: "1.0.0",
        },
        components: {
          schemas: {
            PostUsersRequestBody: {
              type: "object",
              properties: { id: { type: "string" } },
            },
            GetUsersParams: {
              type: "object",
              properties: { limit: { type: "integer" } },
            },
          },
        },
        paths: {
          "/users": {
            get: {
              operationId: "getUsers",
              parameters: [
                {
                  name: "offset",
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
                      properties: { name: { type: "string" } },
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

      expect(warnSpy).toHaveBeenCalledWith(
        'Duplicate component name detected: "PostUsersRequestBody"',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        'Duplicate component name detected: "GetUsersParams"',
      );

      warnSpy.mockRestore();
    });
  });
}
