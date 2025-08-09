import { describe, expect, test } from "vitest";
import { extractMetadata } from "../../../src/transformer/extractors";
import type { OpenAPIDocument } from "../../../src/types";

describe("extractMetadata", () => {
  test("should extract basic metadata", () => {
    const doc: OpenAPIDocument = {
      openapi: "3.0.0",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      paths: {},
    };

    const result = extractMetadata(doc);

    expect(result.title).toBe("Test API");
    expect(result.version).toBe("1.0.0");
    expect(result.openApiVersion).toBe("3.0.0");
  });

  test("should extract metadata with description", () => {
    const doc: OpenAPIDocument = {
      openapi: "3.1.0",
      info: {
        title: "Test API",
        version: "1.0.0",
        description: "A test API description",
      },
      paths: {},
    };

    const result = extractMetadata(doc);

    expect(result.description).toBe("A test API description");
    expect(result.openApiVersion).toBe("3.1.0");
  });

  test("should extract contact information", () => {
    const doc: OpenAPIDocument = {
      openapi: "3.0.0",
      info: {
        title: "Test API",
        version: "1.0.0",
        contact: {
          name: "API Support",
          email: "support@example.com",
          url: "https://example.com/support",
        },
      },
      paths: {},
    };

    const result = extractMetadata(doc);

    expect(result.contact).toBeDefined();
    expect(result.contact?.name).toBe("API Support");
    expect(result.contact?.email).toBe("support@example.com");
    expect(result.contact?.url).toBe("https://example.com/support");
  });

  test("should extract license information", () => {
    const doc: OpenAPIDocument = {
      openapi: "3.0.0",
      info: {
        title: "Test API",
        version: "1.0.0",
        license: {
          name: "MIT",
          url: "https://opensource.org/licenses/MIT",
        },
      },
      paths: {},
    };

    const result = extractMetadata(doc);

    expect(result.license).toBeDefined();
    expect(result.license?.name).toBe("MIT");
    expect(result.license?.url).toBe("https://opensource.org/licenses/MIT");
  });

  test("should handle missing optional fields", () => {
    const doc: OpenAPIDocument = {
      openapi: "3.0.0",
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      paths: {},
    };

    const result = extractMetadata(doc);

    expect(result.description).toBeUndefined();
    expect(result.contact).toBeUndefined();
    expect(result.license).toBeUndefined();
  });
});
