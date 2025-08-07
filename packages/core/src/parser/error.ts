import { XcgenError } from "../errors/base";
import type { ParserErrorCode } from "../errors/codes";

/**
 * Custom error class for OpenAPI parsing errors
 * Extends the base XcgenError for consistent error handling
 *
 * @example
 * ```typescript
 * import { PARSER_ERROR_CODES } from "../errors/codes";
 * throw new XcgenParserError("Invalid OpenAPI format", PARSER_ERROR_CODES.INVALID_FORMAT);
 * ```
 *
 * @example
 * ```typescript
 * import { PARSER_ERROR_CODES } from "../errors/codes";
 * throw new XcgenParserError(
 *   "Syntax error in YAML",
 *   PARSER_ERROR_CODES.SYNTAX_ERROR,
 *   { line: 10, column: 5 }
 * );
 * ```
 */
export class XcgenParserError extends XcgenError {
  /**
   * Creates a new XcgenParserError instance
   * @param message - The error message
   * @param code - Optional parser-specific error code
   * @param details - Optional additional error details
   */
  constructor(message: string, code?: ParserErrorCode, details?: unknown) {
    super(message, code, details);
    this.name = "XcgenParserError";
  }
}

// Maintain backward compatibility by exporting the old name as an alias
// This will be deprecated in a future version
export const ParserError = XcgenParserError;
