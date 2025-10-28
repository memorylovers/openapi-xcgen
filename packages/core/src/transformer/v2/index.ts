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
export { transformArray } from "./transformers/array-transformer";
export { transformMap } from "./transformers/map-transformer";
export { transformAllOf } from "./transformers/allof-transformer";
export { transformOneOf } from "./transformers/oneof-transformer";
export { transformAnyOf } from "./transformers/anyof-transformer";

// Traversers
export { traverseArrayItem } from "./traversers/array-traverser";
export { traverseMapValue } from "./traversers/map-traverser";
export { traverseComposition } from "./traversers/composition-traverser";
// export { traverseObjectProperties } from "./traversers/object-traverser"; // Phase 4で追加予定

// Dispatchers
export { dispatchSchema } from "./dispatchers/schema-dispatcher";
