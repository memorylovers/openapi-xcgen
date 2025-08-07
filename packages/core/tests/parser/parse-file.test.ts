import { describe, test, expect, beforeEach } from "vitest";
import { resolve } from "pathe";
import { OpenAPIParser } from "../../src/parser";
import { XcgenParserError } from "../../src/parser/error";
import { PARSER_ERROR_CODES } from "../../src/errors/codes";

describe("OpenAPIParser", () => {
  let parser: OpenAPIParser;

  beforeEach(() => {
    parser = new OpenAPIParser();
  });

  describe("parse()", () => {
    test("should parse valid OpenAPI YAML file", async () => {
      const filePath = resolve(
        import.meta.dirname,
        "../fixtures/petstore.yaml",
      );
      const result = await parser.parse(filePath);

      expect(result).toBeDefined();
      expect(result.openapi).toMatch(/^3\./);
      expect(result.info).toBeDefined();
      expect(result.info.title).toBe("Petstore API");
      expect(result.info.version).toBe("1.0.0");
      expect(result.paths).toBeDefined();
    });

    test("should dereference $ref pointers", async () => {
      const filePath = resolve(
        import.meta.dirname,
        "../fixtures/petstore.yaml",
      );
      const result = await parser.parse(filePath);

      // Check that references are resolved
      const paths = result.paths;
      if (paths && paths["/pets"] && "get" in paths["/pets"]) {
        const getOperation = paths["/pets"].get;
        if (getOperation?.responses?.["200"]) {
          const response = getOperation.responses["200"];
          if ("content" in response && response.content) {
            const schema = response.content["application/json"]?.schema;
            // Should be resolved, not a $ref
            expect(schema).toBeDefined();
            if (schema && "items" in schema) {
              // Items should be resolved object, not a $ref
              expect(schema.items).not.toHaveProperty("$ref");
              expect(schema.items).toHaveProperty("type");
            }
          }
        }
      }
    });

    test("should throw XcgenParserError for non-existent file", async () => {
      const filePath = resolve(
        import.meta.dirname,
        "../fixtures/not-exist.yaml",
      );

      await expect(parser.parse(filePath)).rejects.toThrow(XcgenParserError);
      await expect(parser.parse(filePath)).rejects.toThrow(
        expect.objectContaining({
          code: PARSER_ERROR_CODES.FILE_NOT_FOUND,
        }),
      );
    });

    test("should throw XcgenParserError for invalid YAML syntax", async () => {
      const filePath = resolve(import.meta.dirname, "../fixtures/invalid.yaml");

      await expect(parser.parse(filePath)).rejects.toThrow(XcgenParserError);
      await expect(parser.parse(filePath)).rejects.toThrow(
        expect.objectContaining({
          code: PARSER_ERROR_CODES.SYNTAX_ERROR,
        }),
      );
    });

    test("should throw XcgenParserError for invalid OpenAPI format", async () => {
      const invalidOpenAPIPath = resolve(
        import.meta.dirname,
        "../fixtures/invalid-openapi.yaml",
      );

      await expect(parser.parse(invalidOpenAPIPath)).rejects.toThrow(
        XcgenParserError,
      );
    });

    test("should handle relative paths", async () => {
      const relativePath = "./tests/fixtures/petstore.yaml";
      const result = await parser.parse(relativePath);

      expect(result).toBeDefined();
      expect(result.info.title).toBe("Petstore API");
    });
  });

  describe("constructor", () => {
    test("should accept basePath option", () => {
      const customParser = new OpenAPIParser({
        basePath: "/custom/path",
      });
      expect(customParser).toBeInstanceOf(OpenAPIParser);
    });

    test("should use default basePath when not provided", () => {
      const defaultParser = new OpenAPIParser();
      expect(defaultParser).toBeInstanceOf(OpenAPIParser);
    });
  });
});
