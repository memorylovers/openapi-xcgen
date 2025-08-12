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
  isPrimitiveType,
  extractRefName,
  extractValidation,
} from "./helpers/index.js";

// Visitor functions
export { visitPrimitive, visitType } from "./visitors/index.js";
