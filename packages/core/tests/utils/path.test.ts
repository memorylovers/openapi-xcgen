import { describe, test, expect } from "vitest";
import {
  extractPathParams,
  normalizePath,
  isParameterizedPath,
  buildPath,
} from "../../src/utils/path";

describe("Path Utilities", () => {
  describe("extractPathParams", () => {
    test("should extract single parameter", () => {
      expect(extractPathParams("/users/{id}")).toEqual(["id"]);
    });

    test("should extract multiple parameters", () => {
      expect(extractPathParams("/users/{userId}/posts/{postId}")).toEqual([
        "userId",
        "postId",
      ]);
    });

    test("should return empty array for paths without parameters", () => {
      expect(extractPathParams("/users")).toEqual([]);
      expect(extractPathParams("/users/list")).toEqual([]);
    });

    test("should handle paths with query strings", () => {
      expect(extractPathParams("/users/{id}?include=posts")).toEqual(["id"]);
    });

    test("should handle edge cases", () => {
      expect(extractPathParams("")).toEqual([]);
      expect(extractPathParams("/")).toEqual([]);
      expect(extractPathParams(null as unknown as string)).toEqual([]);
      expect(extractPathParams(undefined as unknown as string)).toEqual([]);
    });

    test("should handle OpenAPI 3.0 style parameters", () => {
      expect(extractPathParams("/users/{userId}")).toEqual(["userId"]);
      expect(extractPathParams("/pets/{petId}/photos/{photoId}")).toEqual([
        "petId",
        "photoId",
      ]);
    });
  });

  describe("normalizePath", () => {
    test("should add leading slash if missing", () => {
      expect(normalizePath("users")).toBe("/users");
      expect(normalizePath("users/{id}")).toBe("/users/{id}");
    });

    test("should keep existing leading slash", () => {
      expect(normalizePath("/users")).toBe("/users");
      expect(normalizePath("/users/{id}")).toBe("/users/{id}");
    });

    test("should remove trailing slash", () => {
      expect(normalizePath("/users/")).toBe("/users");
      expect(normalizePath("/users/{id}/")).toBe("/users/{id}");
    });

    test("should handle multiple slashes", () => {
      expect(normalizePath("//users//list//")).toBe("/users/list");
      expect(normalizePath("/users//{id}//posts")).toBe("/users/{id}/posts");
    });

    test("should handle edge cases", () => {
      expect(normalizePath("")).toBe("/");
      expect(normalizePath("/")).toBe("/");
      expect(normalizePath("//")).toBe("/");
      expect(normalizePath(null as unknown as string)).toBe("/");
      expect(normalizePath(undefined as unknown as string)).toBe("/");
    });
  });

  describe("isParameterizedPath", () => {
    test("should return true for paths with parameters", () => {
      expect(isParameterizedPath("/users/{id}")).toBe(true);
      expect(isParameterizedPath("/users/{userId}/posts/{postId}")).toBe(true);
    });

    test("should return false for paths without parameters", () => {
      expect(isParameterizedPath("/users")).toBe(false);
      expect(isParameterizedPath("/users/list")).toBe(false);
      expect(isParameterizedPath("/")).toBe(false);
    });

    test("should handle edge cases", () => {
      expect(isParameterizedPath("")).toBe(false);
      expect(isParameterizedPath(null as unknown as string)).toBe(false);
      expect(isParameterizedPath(undefined as unknown as string)).toBe(false);
    });
  });

  describe("buildPath", () => {
    test("should replace single parameter", () => {
      expect(buildPath("/users/{id}", { id: "123" })).toBe("/users/123");
    });

    test("should replace multiple parameters", () => {
      expect(
        buildPath("/users/{userId}/posts/{postId}", {
          userId: "456",
          postId: "789",
        }),
      ).toBe("/users/456/posts/789");
    });

    test("should handle missing parameters", () => {
      expect(buildPath("/users/{id}", {})).toBe("/users/{id}");
      expect(
        buildPath("/users/{userId}/posts/{postId}", { userId: "123" }),
      ).toBe("/users/123/posts/{postId}");
    });

    test("should handle numeric parameters", () => {
      expect(buildPath("/users/{id}", { id: 123 })).toBe("/users/123");
    });

    test("should handle paths without parameters", () => {
      expect(buildPath("/users", { id: "123" })).toBe("/users");
    });

    test("should handle edge cases", () => {
      expect(buildPath("", {})).toBe("/");
      expect(buildPath("/users/{id}", null as unknown as object)).toBe(
        "/users/{id}",
      );
      expect(buildPath("/users/{id}", undefined as unknown as object)).toBe(
        "/users/{id}",
      );
    });
  });
});
