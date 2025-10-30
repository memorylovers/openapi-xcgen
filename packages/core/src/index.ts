// Export type definitions
export type {
  ComponentsObject,
  ContactObject,
  // IR types - Extensions
  IRExtensions,
  IRExtensionValue,
  InfoObject,
  // IR types
  IREndpoint,
  IREnumModel,
  IREnumValue,
  IRHttpMethod,
  IRMetadata,
  IRModel,
  IRParameter,
  IRParameterInType,
  IRParameterModel,
  IRParameterProperty,
  IRProperty,
  IRRef,
  IRRequestBody,
  IRRequestBodyModel,
  IRRequestContent,
  IRResponse,
  IRResponseContent,
  IRResponseHeader,
  IRResponseModel,
  IRScalarType,
  IRTag,
  IRType,
  IRValidation,
  LicenseObject,
  MimeType,
  OpenAPIDocument,
  // OpenAPI types
  OperationObject,
  ParameterObject,
  PathItemObject,
  PathsObject,
  ReferenceObject,
  RequestBodyObject,
  ResponseObject,
  SchemaObject,
  SchemaObjectWithNullable,
  SecuritySchemeObject,
  ServerObject,
  TagObject,
  XcgenIR,
} from "./types";

export type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

// Export guard functions
export { isReferenceObject } from "./types";

// Export HTTP utilities

// Export parser
export { parse, ParserError, XcgenParserError } from "./parser";
export type { OpenAPIParserOptions } from "./parser";

// Export transformer
export {
  extractValidation,
  generateEnumName,
  toIRScalarType,
  transform,
  transformComponents,
  transformEnum,
  transformMetadata,
  transformObject,
  transformTags,
  dispatchSchema,
} from "./transformer";
export type {
  ComponentsTransformResult,
  TransformResult,
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
} from "./transformer";
