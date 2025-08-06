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
