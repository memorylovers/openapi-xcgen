/**
 * Extract path parameters from an OpenAPI path string
 * @param path - The OpenAPI path string (e.g., "/users/{id}")
 * @returns Array of parameter names
 */
export function extractPathParams(path: unknown): string[] {
  if (typeof path !== "string" || !path) {
    return [];
  }

  // Remove query string if present
  const cleanPath = path.split("?")[0];

  // Match parameters in curly braces
  const matches = cleanPath.match(/\{([^}]+)\}/g);

  if (!matches) {
    return [];
  }

  // Extract parameter names without braces
  return matches.map((match) => match.slice(1, -1));
}

/**
 * Normalize a path by ensuring it starts with "/" and removing duplicate/trailing slashes
 * @param path - The path to normalize
 * @returns Normalized path
 */
export function normalizePath(path: unknown): string {
  if (typeof path !== "string" || !path) {
    return "/";
  }

  // Remove duplicate slashes
  let normalized = path.replace(/\/+/g, "/");

  // Ensure leading slash
  if (!normalized.startsWith("/")) {
    normalized = "/" + normalized;
  }

  // Remove trailing slash (except for root)
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * Check if a path contains parameters
 * @param path - The path to check
 * @returns true if the path contains parameters
 */
export function isParameterizedPath(path: unknown): boolean {
  if (typeof path !== "string" || !path) {
    return false;
  }

  return /\{[^}]+\}/.test(path);
}

/**
 * Build a path by replacing parameters with values
 * @param path - The path template
 * @param params - Object containing parameter values
 * @returns Path with parameters replaced
 */
export function buildPath(path: unknown, params: unknown): string {
  if (typeof path !== "string") {
    return "/";
  }

  let normalizedPath = normalizePath(path);

  if (!params || typeof params !== "object") {
    return normalizedPath;
  }

  const paramObj = params as Record<string, unknown>;

  // Replace each parameter with its value
  Object.entries(paramObj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      normalizedPath = normalizedPath.replace(`{${key}}`, String(value));
    }
  });

  return normalizedPath;
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

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
        expect(isParameterizedPath("/users/{userId}/posts/{postId}")).toBe(
          true,
        );
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
}
