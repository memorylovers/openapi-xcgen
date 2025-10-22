/**
 * Visitor functions exports
 *
 * 明示的な名前付きエクスポートを使用してtree-shakingを有効化
 */

// Schema visitors
export {
  visitSchema,
  visitType,
  visitEnum,
  visitObject,
  visitResponseObject,
  visitRequestBodyObject,
  type SchemaVisitorResult,
  type EnumVisitorResult,
  type ObjectVisitorResult,
} from "./schema";

// Components visitors
export { visitComponents, type ComponentsResult } from "./components";

// Paths visitors
export {
  visitPaths,
  visitPathItem,
  type PathsResult,
  type PathItemResult,
} from "./paths";

// Operations visitors
export {
  visitOperation,
  visitParameter,
  visitParameters,
  visitRequestBody,
  visitResponse,
  visitResponses,
  type OperationResult,
  type ParametersResult,
  type RequestBodyResult,
  type ResponseResult,
  type ResponsesResult,
} from "./operations";

// Metadata visitors
export { visitMetadata, visitTags } from "./metadata";

// Servers visitors
export { visitServers } from "./servers-visitor";
