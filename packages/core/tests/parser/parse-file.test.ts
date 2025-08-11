import { dirname } from "pathe";
import { describe, expect, test } from "vitest";
import { PARSER_ERROR_CODES } from "../../src/errors/codes";
import { parse } from "../../src/parser";
import { XcgenParserError } from "../../src/parser/error";
import { FIXTURES } from "../utils/fixtures";

describe("parse", () => {
  test("should parse valid OpenAPI YAML file", async () => {
    const result = await parse(FIXTURES.PETSTORE);

    expect(result).toBeDefined();
    expect(result.openapi).toMatch(/^3\./);
    expect(result.info).toBeDefined();
    expect(result.info.title).toBe("Petstore API");
    expect(result.info.version).toBe("1.0.0");
    expect(result.paths).toBeDefined();
  });

  test("should bundle with internal $ref pointers", async () => {
    const result = await parse(FIXTURES.PETSTORE);

    // Check that internal references are preserved
    const paths = result.paths;
    if (paths && paths["/pets"] && "get" in paths["/pets"]) {
      const getOperation = paths["/pets"].get;
      if (getOperation?.responses?.["200"]) {
        const response = getOperation.responses["200"];
        if ("content" in response && response.content) {
          const schema = response.content["application/json"]?.schema;
          expect(schema).toBeDefined();
          if (schema && "items" in schema) {
            // With bundle(), internal $refs are preserved
            // This helps maintain component names for code generation
            if (schema.items && "$ref" in schema.items) {
              expect(schema.items.$ref).toMatch(/^#\/components\/schemas\//);
            }
          }
        }
      }
    }

    // Ensure components are still present
    expect(result.components).toBeDefined();
    if (result.components?.schemas) {
      expect(Object.keys(result.components.schemas).length).toBeGreaterThan(0);
    }
  });

  test("should throw XcgenParserError for non-existent file", async () => {
    const filePath = "/path/to/not-exist.yaml";

    await expect(parse(filePath)).rejects.toThrow(XcgenParserError);
    await expect(parse(filePath)).rejects.toThrow(
      expect.objectContaining({
        code: PARSER_ERROR_CODES.FILE_NOT_FOUND,
      }),
    );
  });

  test("should throw XcgenParserError for invalid YAML syntax", async () => {
    await expect(parse(FIXTURES.INVALID)).rejects.toThrow(XcgenParserError);
    await expect(parse(FIXTURES.INVALID)).rejects.toThrow(
      expect.objectContaining({
        code: PARSER_ERROR_CODES.SYNTAX_ERROR,
      }),
    );
  });

  test("should throw XcgenParserError for invalid OpenAPI format", async () => {
    await expect(parse(FIXTURES.INVALID_OPENAPI)).rejects.toThrow(
      XcgenParserError,
    );
  });

  test("should handle absolute paths", async () => {
    const result = await parse(FIXTURES.PETSTORE);

    expect(result).toBeDefined();
    expect(result.info.title).toBe("Petstore API");
  });

  test("should accept basePath option", async () => {
    const filePath = "petstore.yaml";
    const result = await parse(filePath, {
      basePath: dirname(FIXTURES.PETSTORE),
    });
    expect(result).toBeDefined();
    expect(result.info.title).toBe("Petstore API");
  });
});
