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
  ContentTraversalResult,
  HeadersTraversalResult,
  ParametersTraversalResult,
  ResponsesTraversalResult,
  OperationTraversalResult,
  ParameterAggregationResult,
  ParameterTransformResult,
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

// Aggregators
export { aggregateParameters } from "./aggregators/parameter-aggregator";

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
export { transformObject } from "./transformers/object-transformer";
export {
  transformParameter,
  type ParameterTransformResult,
} from "./transformers/parameter-transformer";
export {
  transformRequestBody,
  transformRequestBodyObject,
} from "./transformers/request-body-transformer";
export {
  transformResponse,
  transformResponseObject,
} from "./transformers/response-transformer";
export {
  transformPaths,
  type PathsTransformResult,
} from "./transformers/paths-transformer";
export {
  transformOperation,
  type OperationTransformResult,
} from "./transformers/operation-transformer";

// Traversers
export { traverseArrayItem } from "./traversers/array-traverser";
export { traverseMapValue } from "./traversers/map-traverser";
export { traverseComposition } from "./traversers/composition-traverser";
export {
  traverseObjectProperties,
  traverseObjectAdditionalProperties,
} from "./traversers/object-traverser";
export { traverseContent } from "./traversers/content-traverser";
export { traverseHeaders } from "./traversers/headers-traverser";
export { traverseParameters } from "./traversers/parameters-traverser";
export { traverseResponses } from "./traversers/responses-traverser";
export { traverseOperation } from "./traversers/operation-traverser";

// Dispatchers
export { dispatchSchema } from "./dispatchers/schema-dispatcher";
export { dispatchOperation } from "./dispatchers/operation-dispatcher";
