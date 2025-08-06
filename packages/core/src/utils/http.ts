/**
 * Valid HTTP methods supported by OpenAPI
 */
const VALID_HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "OPTIONS",
  "HEAD",
  "TRACE",
] as const;

export type HTTPMethod = (typeof VALID_HTTP_METHODS)[number];

/**
 * Check if a string is a valid HTTP method
 * @param method - The method to validate
 * @returns true if valid, false otherwise
 */
export function isValidHTTPMethod(method: unknown): boolean {
  if (typeof method !== "string") {
    return false;
  }

  const upperMethod = method.toUpperCase();
  return VALID_HTTP_METHODS.includes(upperMethod as HTTPMethod);
}

/**
 * Normalize an HTTP method to uppercase
 * @param method - The method to normalize
 * @returns The normalized method in uppercase
 * @throws Error if the method is invalid
 */
export function normalizeHTTPMethod(method: string): HTTPMethod {
  if (!isValidHTTPMethod(method)) {
    throw new Error(`Invalid HTTP method: ${method}`);
  }

  return method.toUpperCase() as HTTPMethod;
}
