import { describe, test, expect } from "vitest";
import { XcgenParserError, ParserError } from "../../src/parser/error";
import { XcgenError } from "../../src/errors/base";
import { PARSER_ERROR_CODES } from "../../src/errors/codes";

describe("XcgenParserError", () => {
  test("should create parser error with message", () => {
    const error = new XcgenParserError("Failed to parse");
    expect(error.message).toBe("Failed to parse");
    expect(error.name).toBe("XcgenParserError");
    expect(error instanceof Error).toBe(true);
    expect(error instanceof XcgenError).toBe(true);
    expect(error instanceof XcgenParserError).toBe(true);
  });

  test("should have stack trace", () => {
    const error = new XcgenParserError("Test error");
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("XcgenParserError");
  });

  test("should accept error code", () => {
    const error = new XcgenParserError(
      "Failed to parse",
      PARSER_ERROR_CODES.INVALID_FORMAT,
    );
    expect(error.message).toBe("Failed to parse");
    expect(error.code).toBe("INVALID_FORMAT");
  });

  test("should accept error details", () => {
    const details = {
      line: 10,
      column: 5,
      file: "api.yaml",
    };
    const error = new XcgenParserError(
      "Syntax error",
      PARSER_ERROR_CODES.SYNTAX_ERROR,
      details,
    );
    expect(error.message).toBe("Syntax error");
    expect(error.code).toBe("SYNTAX_ERROR");
    expect(error.details).toEqual(details);
  });

  test("should inherit timestamp from XcgenError", () => {
    const before = Date.now();
    const error = new XcgenParserError("Test error");
    const after = Date.now();

    expect(error.timestamp).toBeInstanceOf(Date);
    expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before);
    expect(error.timestamp.getTime()).toBeLessThanOrEqual(after);
  });

  test("should inherit toJSON method from XcgenError", () => {
    const error = new XcgenParserError(
      "JSON test",
      PARSER_ERROR_CODES.PARSE_FAILED,
      {
        key: "value",
      },
    );
    const json = error.toJSON();

    expect(json).toHaveProperty("name", "XcgenParserError");
    expect(json).toHaveProperty("message", "JSON test");
    expect(json).toHaveProperty("code", "PARSE_FAILED");
    expect(json).toHaveProperty("details", { key: "value" });
    expect(json).toHaveProperty("timestamp");
    expect(json).toHaveProperty("stack");
  });

  test("should inherit toString method from XcgenError", () => {
    const error = new XcgenParserError(
      "String test",
      PARSER_ERROR_CODES.INVALID_YAML,
    );
    const string = error.toString();

    expect(string).toContain("XcgenParserError");
    expect(string).toContain("INVALID_YAML");
    expect(string).toContain("String test");
  });

  test("should work with try-catch", () => {
    const throwError = () => {
      throw new XcgenParserError("Test error");
    };

    expect(throwError).toThrow(XcgenParserError);
    expect(throwError).toThrow("Test error");
  });

  test("should be catchable as Error, XcgenError, and XcgenParserError", () => {
    try {
      throw new XcgenParserError("Test error");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(XcgenError);
      expect(error).toBeInstanceOf(XcgenParserError);
    }
  });

  test("should preserve Error.captureStackTrace behavior", () => {
    const error = new XcgenParserError("Stack test");
    const stackLines = error.stack?.split("\n") || [];
    // Stack should start with error name and message
    expect(stackLines[0]).toContain("XcgenParserError");
    expect(stackLines[0]).toContain("Stack test");
  });

  test("backward compatibility: ParserError should be alias for XcgenParserError", () => {
    const error = new ParserError("Backward compat test");
    expect(error).toBeInstanceOf(XcgenParserError);
    expect(error).toBeInstanceOf(XcgenError);
    expect(error.name).toBe("XcgenParserError");
  });
});
