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

// v2 Transformer functions (public API)
export {
  transformComponents,
  transformEnum,
  transformMetadata,
  transformObject,
  transformTags,
  dispatchSchema,
  type ComponentsTransformResult,
  type TransformResult,
} from "./transformers";
