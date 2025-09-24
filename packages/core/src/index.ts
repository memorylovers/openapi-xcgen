// Export type definitions
export type {
  ComponentsObject,
  ContactObject,
  InfoObject,
  // IR types
  IRArray,
  IREndpoint,
  IREnumModel,
  IREnumValue,
  IRHttpMethod,
  IRMap,
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
  visitComponents,
  visitEnum,
  visitObject,
  visitSchema,
  visitType,
} from "./transformer";
export type {
  ComponentsResult,
  ObjectVisitorResult,
  OperationContext,
  ParameterContext,
  ParametersContext,
  PathItemContext,
  RequestBodyContext,
  ResponseContext,
  ResponsesContext,
  SchemaContext,
  SchemaVisitor,
  SchemaVisitorResult,
  VisitorContext,
  VisitorResult,
} from "./transformer";
