/**
 * Transformer module exports
 */

// Main transformer
export { transform } from "./transformer";

// Types
export type { SchemaVisitor, VisitorContext, VisitorResult } from "./types";

// Helper functions
export {
  extractRefName,
  extractValidation,
  generateEnumName,
  toIRScalarType,
} from "./helpers";

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
