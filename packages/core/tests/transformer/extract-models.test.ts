import { describe, it, expect } from "vitest";
import { transform } from "../../src/transformer/transformer.js";
import type { OpenAPIDocument } from "../../src/types/index.js";

describe("extractModels", () => {
  describe("Model extraction", () => {
    it("should return empty array when no components", () => {
      const doc: OpenAPIDocument = {
        openapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        paths: {},
      };

      const ir = transform(doc);

      expect(ir.models).toEqual([]);
    });

    it("should extract a simple model", () => {
      const doc: OpenAPIDocument = {
        openapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        paths: {},
        components: {
          schemas: {
            User: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
              },
              required: ["id"],
            },
          },
        },
      };

      const ir = transform(doc);

      expect(ir.models).toHaveLength(1);
      expect(ir.models[0]).toEqual({
        name: "User",
        description: undefined,
        properties: [
          {
            name: "id",
            type: { kind: "primitive", type: "integer", format: undefined },
            required: true,
            description: undefined,
          },
          {
            name: "name",
            type: { kind: "primitive", type: "string", format: undefined },
            required: false,
            description: undefined,
          },
        ],
      });
    });

    it("should extract multiple models", () => {
      const doc: OpenAPIDocument = {
        openapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        paths: {},
        components: {
          schemas: {
            User: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
              },
            },
            Product: {
              type: "object",
              properties: {
                id: { type: "integer" },
                title: { type: "string" },
                price: { type: "number" },
              },
            },
          },
        },
      };

      const ir = transform(doc);

      expect(ir.models).toHaveLength(2);
      expect(ir.models[0]).toEqual({
        name: "User",
        description: undefined,
        properties: [
          {
            name: "id",
            type: { kind: "primitive", type: "integer", format: undefined },
            required: false,
            description: undefined,
          },
          {
            name: "name",
            type: { kind: "primitive", type: "string", format: undefined },
            required: false,
            description: undefined,
          },
        ],
      });
      expect(ir.models[1]).toEqual({
        name: "Product",
        description: undefined,
        properties: [
          {
            name: "id",
            type: { kind: "primitive", type: "integer", format: undefined },
            required: false,
            description: undefined,
          },
          {
            name: "title",
            type: { kind: "primitive", type: "string", format: undefined },
            required: false,
            description: undefined,
          },
          {
            name: "price",
            type: { kind: "primitive", type: "number", format: undefined },
            required: false,
            description: undefined,
          },
        ],
      });
    });
  });

  describe("Property resolution", () => {
    it("should correctly identify required and optional properties", () => {
      const doc: OpenAPIDocument = {
        openapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        paths: {},
        components: {
          schemas: {
            User: {
              type: "object",
              properties: {
                id: { type: "integer" },
                name: { type: "string" },
                email: { type: "string" },
              },
              required: ["id", "name"],
            },
          },
        },
      };

      const ir = transform(doc);

      expect(ir.models[0]).toEqual({
        name: "User",
        description: undefined,
        properties: [
          {
            name: "id",
            type: { kind: "primitive", type: "integer", format: undefined },
            required: true,
            description: undefined,
          },
          {
            name: "name",
            type: { kind: "primitive", type: "string", format: undefined },
            required: true,
            description: undefined,
          },
          {
            name: "email",
            type: { kind: "primitive", type: "string", format: undefined },
            required: false,
            description: undefined,
          },
        ],
      });
    });
  });

  describe("Type resolution", () => {
    it("should resolve different types correctly", () => {
      const doc: OpenAPIDocument = {
        openapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        paths: {},
        components: {
          schemas: {
            Product: {
              type: "object",
              properties: {
                id: { type: "integer" },
                price: { type: "number" },
                name: { type: "string" },
                active: { type: "boolean" },
                tags: {
                  type: "array",
                  items: { type: "string" },
                },
                category: {
                  $ref: "#/components/schemas/Category",
                },
              },
            },
          },
        },
      };

      const ir = transform(doc);
      const product = ir.models[0];

      expect(product.properties[0].type).toEqual({
        kind: "primitive",
        type: "integer",
        format: undefined,
      });
      expect(product.properties[1].type).toEqual({
        kind: "primitive",
        type: "number",
        format: undefined,
      });
      expect(product.properties[2].type).toEqual({
        kind: "primitive",
        type: "string",
        format: undefined,
      });
      expect(product.properties[3].type).toEqual({
        kind: "primitive",
        type: "boolean",
        format: undefined,
      });
      expect(product.properties[4].type).toEqual({
        kind: "array",
        itemType: { kind: "primitive", type: "string", format: undefined },
      });
      expect(product.properties[5].type).toEqual({
        kind: "ref",
        name: "Category",
      });
    });

    it("should handle formatted string types", () => {
      const doc: OpenAPIDocument = {
        openapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        paths: {},
        components: {
          schemas: {
            Event: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                createdAt: { type: "string", format: "date-time" },
                date: { type: "string", format: "date" },
                email: { type: "string", format: "email" },
              },
            },
          },
        },
      };

      const ir = transform(doc);
      const event = ir.models[0];

      expect(event.properties[0].type).toEqual({
        kind: "primitive",
        type: "string",
        format: "uuid",
      });
      expect(event.properties[1].type).toEqual({
        kind: "primitive",
        type: "string",
        format: "date-time",
      });
      expect(event.properties[2].type).toEqual({
        kind: "primitive",
        type: "string",
        format: "date",
      });
      expect(event.properties[3].type).toEqual({
        kind: "primitive",
        type: "string",
        format: "email",
      });
    });
  });
});
