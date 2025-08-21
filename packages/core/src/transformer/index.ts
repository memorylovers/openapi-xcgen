/**
 * Transformer module exports
 */

// Types
export type { VisitorContext, VisitorResult, SchemaVisitor } from "./types.js";
export { createContext } from "./types.js";

// Context utilities
export {
  withPath,
  withDepth,
  withVisited,
  isCircularReference,
  isDepthLimitExceeded,
} from "./context.js";

// Helper functions
export {
  extractRefName,
  extractValidation,
  generateEnumName,
  toIRScalarType,
} from "./helpers/index.js";

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
} from "./visitors/index.js";
