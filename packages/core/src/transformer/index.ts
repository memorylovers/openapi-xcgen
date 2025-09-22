/**
 * Transformer module exports
 */

// Main transformer
export { transform } from "./transformer";

// Types
export type {
  OperationContext,
  ParameterContext,
  ParametersContext,
  PathItemContext,
  RequestBodyContext,
  ResponseContext,
  ResponsesContext,
  SchemaContext,
  SchemaVisitor,
  VisitorContext,
  VisitorResult,
} from "./types";

// Helper functions
export { extractValidation, generateEnumName, toIRScalarType } from "./helpers";

// Visitor functions
export {
  visitComponents,
  visitEnum,
  visitObject,
  visitSchema,
  visitType,
  type ComponentsResult,
  type ObjectVisitorResult,
  type SchemaVisitorResult,
} from "./visitors";
