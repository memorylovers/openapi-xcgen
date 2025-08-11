import type { XcgenErrorCode } from "./codes";

/**
 * Base error class for all openapi-xcgen errors
 * Provides common functionality and structure for error handling
 */
export class XcgenError extends Error {
  /**
   * Error code for categorizing the error
   */
  public readonly code?: XcgenErrorCode;

  /**
   * Additional details about the error
   */
  public readonly details?: unknown;

  /**
   * Timestamp when the error was created
   */
  public readonly timestamp: Date;

  /**
   * Creates a new XcgenError instance
   * @param message - The error message
   * @param code - Optional error code
   * @param details - Optional additional error details
   */
  constructor(message: string, code?: XcgenErrorCode, details?: unknown) {
    super(message);
    this.name = "XcgenError";
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set the prototype explicitly to ensure instanceof checks work correctly
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Converts the error to a JSON representation
   * @returns JSON object with error properties
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }

  /**
   * Returns a string representation of the error
   * @returns Formatted error string
   */
  toString(): string {
    const parts = [this.name];
    if (this.code) {
      parts.push(`[${this.code}]`);
    }
    parts.push(`:`, this.message);
    return parts.join(" ");
  }
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;
  const { GENERAL_ERROR_CODES } = await import("./codes.js");

  describe("XcgenError", () => {
    test("should create base error with message", () => {
      const error = new XcgenError("Base error occurred");
      expect(error.message).toBe("Base error occurred");
      expect(error.name).toBe("XcgenError");
      expect(error instanceof Error).toBe(true);
    });

    test("should have timestamp", () => {
      const before = Date.now();
      const error = new XcgenError("Test error");
      const after = Date.now();

      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before);
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(after);
    });

    test("should accept error code and details", () => {
      const details = { file: "test.yaml", line: 10 };
      const error = new XcgenError(
        "Error with details",
        GENERAL_ERROR_CODES.INTERNAL_ERROR,
        details,
      );

      expect(error.message).toBe("Error with details");
      expect(error.code).toBe("INTERNAL_ERROR");
      expect(error.details).toEqual(details);
    });

    test("should serialize to JSON", () => {
      const error = new XcgenError(
        "JSON test",
        GENERAL_ERROR_CODES.UNKNOWN_ERROR,
        { key: "value" },
      );
      const json = error.toJSON();

      expect(json).toHaveProperty("name", "XcgenError");
      expect(json).toHaveProperty("message", "JSON test");
      expect(json).toHaveProperty("code", "UNKNOWN_ERROR");
      expect(json).toHaveProperty("details", { key: "value" });
      expect(json).toHaveProperty("timestamp");
      expect(json).toHaveProperty("stack");
    });

    test("should have custom toString implementation", () => {
      const error = new XcgenError(
        "String test",
        GENERAL_ERROR_CODES.INTERNAL_ERROR,
      );
      const string = error.toString();

      expect(string).toContain("XcgenError");
      expect(string).toContain("INTERNAL_ERROR");
      expect(string).toContain("String test");
    });

    test("should preserve stack trace", () => {
      const error = new XcgenError("Stack test");
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("XcgenError");
      expect(error.stack).toContain("Stack test");
    });

    test("should work with instanceof checks", () => {
      const error = new XcgenError("Instance test");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(XcgenError);
    });

    test("should be catchable in try-catch", () => {
      const throwError = () => {
        throw new XcgenError("Catch test", GENERAL_ERROR_CODES.INTERNAL_ERROR);
      };

      expect(throwError).toThrow(XcgenError);
      expect(throwError).toThrow("Catch test");

      try {
        throwError();
      } catch (error) {
        expect(error).toBeInstanceOf(XcgenError);
        if (error instanceof XcgenError) {
          expect(error.code).toBe("INTERNAL_ERROR");
        }
      }
    });
  });
}
