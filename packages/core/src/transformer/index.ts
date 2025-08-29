/**
 * Transformer module exports
 */

// Main transformer
export { transform } from "./transformer";

// Types
export type { VisitorContext, VisitorResult, SchemaVisitor } from "./types";
export { createContext } from "./types";

// Context utilities
export {
  withPath,
  withDepth,
  withVisited,
  isCircularReference,
  isDepthLimitExceeded,
} from "./context";

// Helper functions
export {
  extractRefName,
  extractValidation,
  generateEnumName,
  toIRScalarType,
} from "./helpers/index";

// Visitor functions
export {
  visitComponents,
  type ComponentsResult,
  visitPrimitive,
  visitType,
  visitEnum,
  type EnumVisitorContext,
  visitObject,
  type ObjectVisitorContext,
  type ObjectVisitorResult,
  visitSchema,
  type SchemaVisitorContext,
  type SchemaVisitorResult,
} from "./visitors/index";
