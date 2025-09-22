/**
 * Parser向けのエラーコード定義
 */
export const PARSER_ERROR_CODES = {
  INVALID_FORMAT: "INVALID_FORMAT",
  SYNTAX_ERROR: "SYNTAX_ERROR",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  INVALID_YAML: "INVALID_YAML",
  INVALID_JSON: "INVALID_JSON",
  PARSE_FAILED: "PARSE_FAILED",
} as const;

export type ParserErrorCode =
  (typeof PARSER_ERROR_CODES)[keyof typeof PARSER_ERROR_CODES];

/**
 * Custom error class for OpenAPI parsing errors
 * Provides structured metadata without relying on a shared base class
 *
 * @example
 * ```typescript
 * import { PARSER_ERROR_CODES } from "./error";
 * throw new XcgenParserError("Invalid OpenAPI format", PARSER_ERROR_CODES.INVALID_FORMAT);
 * ```
 *
 * @example
 * ```typescript
 * import { PARSER_ERROR_CODES } from "./error";
 * throw new XcgenParserError(
 *   "Syntax error in YAML",
 *   PARSER_ERROR_CODES.SYNTAX_ERROR,
 *   { line: 10, column: 5 }
 * );
 * ```
 */
export class XcgenParserError extends Error {
  /**
   * Parser-specific error code
   */
  public readonly code?: ParserErrorCode;

  /**
   * Additional error context
   */
  public readonly details?: unknown;

  /**
   * Creates a new XcgenParserError instance
   * @param message - The error message
   * @param code - Optional parser-specific error code
   * @param details - Optional additional error details
   */
  constructor(message: string, code?: ParserErrorCode, details?: unknown) {
    super(message);
    this.name = "XcgenParserError";
    this.code = code;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
// Maintain backward compatibility by exporting the old name as an alias
// This will be deprecated in a future version
export const ParserError = XcgenParserError;
