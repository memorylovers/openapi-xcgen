/**
 * Error codes for openapi-xcgen
 * Provides standardized error codes for consistent error handling
 */

/**
 * Parser-related error codes
 */
export const PARSER_ERROR_CODES = {
  INVALID_FORMAT: "INVALID_FORMAT",
  SYNTAX_ERROR: "SYNTAX_ERROR",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  INVALID_YAML: "INVALID_YAML",
  INVALID_JSON: "INVALID_JSON",
  PARSE_FAILED: "PARSE_FAILED",
} as const;

/**
 * Validator-related error codes
 */
export const VALIDATOR_ERROR_CODES = {
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_TYPE: "INVALID_TYPE",
  INVALID_SCHEMA: "INVALID_SCHEMA",
  INVALID_REFERENCE: "INVALID_REFERENCE",
  VALIDATION_FAILED: "VALIDATION_FAILED",
} as const;

/**
 * Resolver-related error codes
 */
export const RESOLVER_ERROR_CODES = {
  REFERENCE_NOT_FOUND: "REFERENCE_NOT_FOUND",
  CIRCULAR_REFERENCE: "CIRCULAR_REFERENCE",
  INVALID_REF_PATH: "INVALID_REF_PATH",
  RESOLUTION_FAILED: "RESOLUTION_FAILED",
} as const;

/**
 * Generator-related error codes
 */
export const GENERATOR_ERROR_CODES = {
  UNSUPPORTED_LANGUAGE: "UNSUPPORTED_LANGUAGE",
  TEMPLATE_NOT_FOUND: "TEMPLATE_NOT_FOUND",
  GENERATION_FAILED: "GENERATION_FAILED",
  WRITE_FAILED: "WRITE_FAILED",
} as const;

/**
 * General error codes
 */
export const GENERAL_ERROR_CODES = {
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NOT_IMPLEMENTED: "NOT_IMPLEMENTED",
} as const;

/**
 * All error codes combined
 */
export const XCGEN_ERROR_CODES = {
  ...PARSER_ERROR_CODES,
  ...VALIDATOR_ERROR_CODES,
  ...RESOLVER_ERROR_CODES,
  ...GENERATOR_ERROR_CODES,
  ...GENERAL_ERROR_CODES,
} as const;

/**
 * Type for all possible error codes
 */
export type XcgenErrorCode =
  (typeof XCGEN_ERROR_CODES)[keyof typeof XCGEN_ERROR_CODES];

/**
 * Type for parser-specific error codes
 */
export type ParserErrorCode =
  (typeof PARSER_ERROR_CODES)[keyof typeof PARSER_ERROR_CODES];

/**
 * Type for validator-specific error codes
 */
export type ValidatorErrorCode =
  (typeof VALIDATOR_ERROR_CODES)[keyof typeof VALIDATOR_ERROR_CODES];

/**
 * Type for resolver-specific error codes
 */
export type ResolverErrorCode =
  (typeof RESOLVER_ERROR_CODES)[keyof typeof RESOLVER_ERROR_CODES];

/**
 * Type for generator-specific error codes
 */
export type GeneratorErrorCode =
  (typeof GENERATOR_ERROR_CODES)[keyof typeof GENERATOR_ERROR_CODES];
