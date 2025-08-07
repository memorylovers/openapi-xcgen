/**
 * Error module exports
 * Provides centralized error classes for openapi-xcgen
 */

// Base error class
export { XcgenError } from "./base";

// Error codes and types
export {
  XCGEN_ERROR_CODES,
  PARSER_ERROR_CODES,
  VALIDATOR_ERROR_CODES,
  RESOLVER_ERROR_CODES,
  GENERATOR_ERROR_CODES,
  GENERAL_ERROR_CODES,
  type XcgenErrorCode,
  type ParserErrorCode,
  type ValidatorErrorCode,
  type ResolverErrorCode,
  type GeneratorErrorCode,
} from "./codes";

// Re-export parser errors from parser module
export { XcgenParserError, ParserError } from "../parser/error";
