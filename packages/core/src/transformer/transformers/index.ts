/**
 * v2 Transformer Architecture
 *
 * 3層アーキテクチャ（Dispatcher/Traverser/Transformer）の
 * 統一されたエクスポートポイントです。
 */

// Types
export type {
  AdditionalPropertiesTraversalResult,
  ArrayItemTraversalResult,
  CompositionTraversalResult,
  ContentTraversalResult,
  HeadersTraversalResult,
  OperationTraversalResult,
  ParameterAggregationResult,
  ParametersTraversalResult,
  ParameterTransformResult,
  PropertyTraversalResult,
  ResponsesTraversalResult,
  TransformError,
  TransformResult,
} from "./types";

// Context
export {
  buildAdditionalPropertiesContext,
  buildArrayItemContext,
  buildCompositionItemContext,
  buildPropertyContext,
} from "./context";
export type { TransformContext } from "./context";

// Errors
export { collectErrors, createErrorResult, isErrorResult } from "./errors";

// Aggregators
export { aggregateParameters } from "./aggregators/parameter-aggregator";

// Transformers
export { transformAllOf } from "./transformers/allof-transformer";
export { transformAnyOf } from "./transformers/anyof-transformer";
export { transformArray } from "./transformers/array-transformer";
export {
  transformComponents,
  type ComponentsTransformResult,
} from "./transformers/components-transformer";
export { transformEnum } from "./transformers/enum-transformer";
export { transformMap } from "./transformers/map-transformer";
export { transformMetadata } from "./transformers/metadata-transformer";
export { transformObject } from "./transformers/object-transformer";
export { transformOneOf } from "./transformers/oneof-transformer";
export {
  transformOperation,
  type OperationTransformResult,
} from "./transformers/operation-transformer";
export { transformParameter } from "./transformers/parameter-transformer";
export {
  transformPaths,
  type PathsTransformResult,
} from "./transformers/paths-transformer";
export { transformPrimitive } from "./transformers/primitive-transformer";
export { transformRequestBody } from "./transformers/request-body-transformer";
export { transformRequestBodyObject } from "./transformers/request-body-object-transformer";
export { transformResponse } from "./transformers/response-transformer";
export { transformResponseObject } from "./transformers/response-object-transformer";
export { transformSecurityScheme } from "./transformers/security-scheme-transformer";
export { transformSecuritySchemes } from "./transformers/security-schemes-transformer";
export {
  transformServers,
  type ServersTransformResult,
} from "./transformers/servers-transformer";
export { transformTags } from "./transformers/tags-transformer";

// Traversers
export { traverseArrayItem } from "./traversers/array-traverser";
export { traverseComposition } from "./traversers/composition-traverser";
export { traverseContent } from "./traversers/content-traverser";
export { traverseHeaders } from "./traversers/headers-traverser";
export { traverseMapValue } from "./traversers/map-traverser";
export {
  traverseObjectAdditionalProperties,
  traverseObjectProperties,
} from "./traversers/object-traverser";
export { traverseOperation } from "./traversers/operation-traverser";
export { traverseParameters } from "./traversers/parameters-traverser";
export { traverseResponses } from "./traversers/responses-traverser";

// Dispatchers
export { dispatchOperation } from "./dispatchers/operation-dispatcher";
export { dispatchSchema } from "./dispatchers/schema-dispatcher";
