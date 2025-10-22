import {
  PARSER_ERROR_CODES,
  XcgenParserError,
  type ParserErrorCode,
} from "./error";

/**
 * Create an error for invalid OpenAPI version
 * @param version - The detected OpenAPI version
 * @param filePath - The file path being parsed
 * @returns XcgenParserError with appropriate message and details
 */
export function createInvalidVersionError(
  version: string | undefined,
  filePath: string,
): XcgenParserError {
  return new XcgenParserError(
    `Invalid OpenAPI version: ${version || "unknown"}. Only OpenAPI 3.x is supported.`,
    PARSER_ERROR_CODES.INVALID_FORMAT,
    { version, path: filePath },
  );
}

/**
 * Create an error for parse failures with appropriate error code
 * @param errorMessage - The original error message
 * @param filePath - The file path being parsed
 * @param originalError - The original error object
 * @returns XcgenParserError with determined error code
 */
export function createParseFailedError(
  errorMessage: string,
  filePath: string,
  originalError: unknown,
): XcgenParserError {
  // Determine error code based on error message
  let errorCode: ParserErrorCode = PARSER_ERROR_CODES.PARSE_FAILED;

  if (
    errorMessage.includes("ENOENT") ||
    errorMessage.includes("no such file")
  ) {
    errorCode = PARSER_ERROR_CODES.FILE_NOT_FOUND;
  } else if (errorMessage.includes("YAML")) {
    errorCode = PARSER_ERROR_CODES.SYNTAX_ERROR;
  } else if (
    errorMessage.includes("Invalid") ||
    errorMessage.includes("schema")
  ) {
    errorCode = PARSER_ERROR_CODES.INVALID_FORMAT;
  }

  return new XcgenParserError(
    `Failed to parse OpenAPI document: ${errorMessage}`,
    errorCode,
    { originalError, path: filePath },
  );
}
