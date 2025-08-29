/**
 * Transformer E2E tests
 *
 * 実際のOpenAPIファイルを使用したEnd-to-End統合テスト
 */

import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { parse } from "../../src/parser/index.js";
import { transform } from "../../src/transformer/index.js";
import type {
  IRModel,
  IRService,
  IREndpoint,
  IRProperty,
  IREnum,
  IREnumValue,
} from "../../src/types/ir/index.js";

/**
 * テストヘルパー: YAMLファイルを読み込んでIRに変換
 */
async function transformFromFile(filename: string) {
  const filepath = join("tests", "fixtures", filename);

  // Parse YAML file to OpenAPIDocument
  const document = await parse(filepath);

  // Transform to IR
  return transform(document);
}

describe("Transformer E2E Tests", () => {
  describe("petstore.yaml", () => {
    it("should transform Pet Store API from YAML file", async () => {
      const result = await transformFromFile("petstore.yaml");

      // Info検証
      expect(result.info).toEqual({
        title: "Petstore API",
        version: "1.0.0",
        description: "A simple petstore API",
      });

      // Models検証
      expect(result.models).toHaveLength(3);

      const petModel = result.models.find((m: IRModel) => m.name === "Pet");
      expect(petModel).toBeDefined();
      expect(petModel?.properties).toHaveLength(3);
      expect(petModel?.properties.map((p: IRProperty) => p.name)).toEqual([
        "id",
        "name",
        "tag",
      ]);

      const newPetModel = result.models.find(
        (m: IRModel) => m.name === "NewPet",
      );
      expect(newPetModel).toBeDefined();
      expect(newPetModel?.properties).toHaveLength(2);

      const errorModel = result.models.find((m: IRModel) => m.name === "Error");
      expect(errorModel).toBeDefined();
      expect(errorModel?.properties).toHaveLength(2);

      // Enums検証 - petstore.yamlにはenumがない
      expect(result.enums).toHaveLength(0);

      // Services検証
      expect(result.services).toHaveLength(1);
      const petsService = result.services[0];
      expect(petsService.name).toBe("pets");
      expect(petsService.endpoints).toHaveLength(3); // listPets, createPet, getPetById

      // Endpoints詳細検証
      const listPets = petsService.endpoints.find(
        (e: IREndpoint) => e.id === "listPets",
      );
      expect(listPets).toBeDefined();
      expect(listPets?.method).toBe("get");
      expect(listPets?.path).toBe("/pets");
      expect(listPets?.parameters).toHaveLength(1);
      expect(listPets?.parameters[0]).toMatchObject({
        name: "limit",
        in: "query",
        required: false,
        type: { kind: "primitive", type: "integer" },
      });

      const createPet = petsService.endpoints.find(
        (e: IREndpoint) => e.id === "createPet",
      );
      expect(createPet).toBeDefined();
      expect(createPet?.method).toBe("post");
      expect(createPet?.requestBody).toBeDefined();
      expect(createPet?.requestBody?.required).toBe(true);

      const getPetById = petsService.endpoints.find(
        (e: IREndpoint) => e.id === "getPetById",
      );
      expect(getPetById).toBeDefined();
      expect(getPetById?.parameters).toHaveLength(1);
      expect(getPetById?.parameters[0]).toMatchObject({
        name: "petId",
        in: "path",
        required: true,
      });
    });
  });

  describe("multi-service.yaml", () => {
    it("should handle multiple services with proper tag grouping", async () => {
      const result = await transformFromFile("multi-service.yaml");

      // Info検証
      expect(result.info.title).toBe("Multi-Service API");
      expect(result.info.version).toBe("2.0.0");

      // Services検証 - 4つのサービス（users, posts, admin, default）
      expect(result.services).toHaveLength(4);

      // Users service
      const usersService = result.services.find(
        (s: IRService) => s.name === "users",
      );
      expect(usersService).toBeDefined();
      expect(usersService?.endpoints).toHaveLength(2);
      expect(usersService?.endpoints.map((e: IREndpoint) => e.id)).toContain(
        "listUsers",
      );
      expect(usersService?.endpoints.map((e: IREndpoint) => e.id)).toContain(
        "getUser",
      );

      // Posts service
      const postsService = result.services.find(
        (s: IRService) => s.name === "posts",
      );
      expect(postsService).toBeDefined();
      expect(postsService?.endpoints).toHaveLength(2);
      expect(postsService?.endpoints.map((e: IREndpoint) => e.id)).toContain(
        "listPosts",
      );
      expect(postsService?.endpoints.map((e: IREndpoint) => e.id)).toContain(
        "createPost",
      );

      // Admin service
      const adminService = result.services.find(
        (s: IRService) => s.name === "admin",
      );
      expect(adminService).toBeDefined();
      expect(adminService?.endpoints).toHaveLength(1);
      expect(adminService?.endpoints[0].id).toBe("getSettings");

      // Default service (タグなしエンドポイント)
      const defaultService = result.services.find(
        (s: IRService) => s.name === "default",
      );
      expect(defaultService).toBeDefined();
      expect(defaultService?.endpoints).toHaveLength(1);
      expect(defaultService?.endpoints[0].id).toBe("healthCheck");

      // Enums検証 - roleのenum
      expect(result.enums).toHaveLength(1);
      const roleEnum = result.enums[0];
      expect(roleEnum.name).toBe("UserRole");
      expect(roleEnum.values).toHaveLength(3);
      expect(roleEnum.values.map((v: IREnumValue) => v.value)).toEqual([
        "admin",
        "user",
        "guest",
      ]);
    });
  });

  describe("complex-schema.yaml", () => {
    it("should handle complex nested schemas and multiple enums", async () => {
      const result = await transformFromFile("complex-schema.yaml");

      // Info検証
      expect(result.info.title).toBe("Complex Schema API");

      // Models検証
      const orderModel = result.models.find((m: IRModel) => m.name === "Order");
      expect(orderModel).toBeDefined();
      // metadataはadditionalPropertiesのため現在は処理されない
      expect(orderModel?.properties.length).toBeGreaterThanOrEqual(8);

      // プロパティの型検証
      const itemsProperty = orderModel?.properties.find(
        (p: IRProperty) => p.name === "items",
      );
      expect(itemsProperty?.type.kind).toBe("array");
      expect(itemsProperty?.required).toBe(true);

      const customerProperty = orderModel?.properties.find(
        (p: IRProperty) => p.name === "customer",
      );
      // ネストされたオブジェクトは別モデルとして抽出され、refになる
      expect(
        ["object", "ref"].includes(customerProperty?.type.kind || ""),
      ).toBe(true);
      expect(customerProperty?.required).toBe(true);

      // metadataプロパティはadditionalPropertiesのため現在は処理されない
      const metadataProperty = orderModel?.properties.find(
        (p: IRProperty) => p.name === "metadata",
      );
      expect(metadataProperty).toBeUndefined();

      const tagsProperty = orderModel?.properties.find(
        (p: IRProperty) => p.name === "tags",
      );
      expect(tagsProperty?.type.kind).toBe("array");

      // Enums検証 - statusとpriorityの2つ
      expect(result.enums).toHaveLength(2);

      const statusEnum = result.enums.find(
        (e: IREnum) => e.name === "OrderStatus",
      );
      expect(statusEnum).toBeDefined();
      expect(statusEnum?.values).toHaveLength(5);
      expect(statusEnum?.values.map((v: IREnumValue) => v.value)).toContain(
        "delivered",
      );

      const priorityEnum = result.enums.find(
        (e: IREnum) => e.name === "OrderPriority",
      );
      expect(priorityEnum).toBeDefined();
      expect(priorityEnum?.values).toHaveLength(4);
      expect(priorityEnum?.values.map((v: IREnumValue) => v.value)).toContain(
        "urgent",
      );

      // Services検証
      expect(result.services).toHaveLength(1);
      const ordersService = result.services[0];
      expect(ordersService.name).toBe("orders");
      expect(ordersService.endpoints).toHaveLength(1);
      expect(ordersService.endpoints[0].id).toBe("createOrder");
    });
  });

  describe("Error handling", () => {
    it("should handle invalid OpenAPI files gracefully", async () => {
      await expect(transformFromFile("invalid.yaml")).rejects.toThrow();
    });

    it("should handle files with invalid OpenAPI version", async () => {
      await expect(transformFromFile("invalid-openapi.yaml")).rejects.toThrow();
    });
  });
});
