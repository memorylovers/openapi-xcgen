import { describe, expect, test } from "vitest";
import { isValidHTTPMethod, normalizeHTTPMethod } from "../../src/utils/http";

describe("HTTP Utilities", () => {
  describe("isValidHTTPMethod", () => {
    test("should validate standard HTTP methods", () => {
      expect(isValidHTTPMethod("GET")).toBe(true);
      expect(isValidHTTPMethod("POST")).toBe(true);
      expect(isValidHTTPMethod("PUT")).toBe(true);
      expect(isValidHTTPMethod("DELETE")).toBe(true);
      expect(isValidHTTPMethod("PATCH")).toBe(true);
      expect(isValidHTTPMethod("OPTIONS")).toBe(true);
      expect(isValidHTTPMethod("HEAD")).toBe(true);
      expect(isValidHTTPMethod("TRACE")).toBe(true);
    });

    test("should validate lowercase HTTP methods", () => {
      expect(isValidHTTPMethod("get")).toBe(true);
      expect(isValidHTTPMethod("post")).toBe(true);
      expect(isValidHTTPMethod("put")).toBe(true);
      expect(isValidHTTPMethod("delete")).toBe(true);
      expect(isValidHTTPMethod("patch")).toBe(true);
    });

    test("should validate mixed case HTTP methods", () => {
      expect(isValidHTTPMethod("Get")).toBe(true);
      expect(isValidHTTPMethod("Post")).toBe(true);
      expect(isValidHTTPMethod("PuT")).toBe(true);
    });

    test("should reject invalid HTTP methods", () => {
      expect(isValidHTTPMethod("INVALID")).toBe(false);
      expect(isValidHTTPMethod("CONNECT")).toBe(false);
      expect(isValidHTTPMethod("")).toBe(false);
      expect(isValidHTTPMethod("123")).toBe(false);
    });

    test("should handle edge cases", () => {
      expect(isValidHTTPMethod(null as unknown)).toBe(false);
      expect(isValidHTTPMethod(undefined as unknown)).toBe(false);
      expect(isValidHTTPMethod(123 as unknown)).toBe(false);
      expect(isValidHTTPMethod({} as unknown)).toBe(false);
    });
  });

  describe("normalizeHTTPMethod", () => {
    test("should normalize to uppercase", () => {
      expect(normalizeHTTPMethod("get")).toBe("GET");
      expect(normalizeHTTPMethod("post")).toBe("POST");
      expect(normalizeHTTPMethod("Put")).toBe("PUT");
      expect(normalizeHTTPMethod("DELETE")).toBe("DELETE");
    });

    test("should throw error for invalid methods", () => {
      expect(() => normalizeHTTPMethod("INVALID")).toThrow(
        "Invalid HTTP method: INVALID",
      );
      expect(() => normalizeHTTPMethod("")).toThrow("Invalid HTTP method: ");
    });

    test("should handle edge cases", () => {
      expect(() => normalizeHTTPMethod(null as unknown as string)).toThrow();
      expect(() =>
        normalizeHTTPMethod(undefined as unknown as string),
      ).toThrow();
    });
  });
});
