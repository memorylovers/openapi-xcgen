/**
 * v2 Transformer Architecture
 *
 * 3層アーキテクチャ（Dispatcher/Traverser/Transformer）の
 * 統一されたエクスポートポイントです。
 */

// Types
export type {
  TransformResult,
  TransformError,
  PropertyTraversalResult,
  AdditionalPropertiesTraversalResult,
  ArrayItemTraversalResult,
  CompositionTraversalResult,
} from "./types";

// Context
export type { TransformContext } from "./context";
export {
  buildPropertyContext,
  buildAdditionalPropertiesContext,
  buildArrayItemContext,
  buildCompositionItemContext,
} from "./context";

// Errors
export { createErrorResult, isErrorResult, collectErrors } from "./errors";

// Transformers
export { transformEnum } from "./transformers/enum-transformer";
export { transformPrimitive } from "./transformers/primitive-transformer";
export {
  transformServers,
  type ServersTransformResult,
} from "./transformers/servers-transformer";

// Traversers (Phase 2で追加予定)
// export { traverseArrayItem } from "./traversers/array-traverser";
// export { traverseObjectProperties } from "./traversers/object-traverser";

// Dispatchers (Phase 2で追加予定)
// export { dispatchSchema } from "./dispatchers/schema-dispatcher";
