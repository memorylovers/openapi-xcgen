// Export type definitions
export type {
  ComponentsObject,
  ContactObject,
  InfoObject,
  // IR types
  IRApiKeyConfig,
  IRArray,
  IRContact,
  IREndpoint,
  IREnumModel,
  IREnumValue,
  IRHttpMethod,
  IRLicense,
  IRMap,
  IRMetadata,
  IRModel,
  IROAuth2Flow,
  IROAuth2Flows,
  IROAuth2ScopeMap,
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
  IRSecurityScheme,
  IRServer,
  IRServerVariable,
  IRServerVariableMap,
  IRTag,
  IRType,
  IRValidation,
  LicenseObject,
  MimeType,
  OpenAPIDocument,
  // OpenAPI types
  OpenAPIV3,
  OpenAPIV3_1,
  OpenAPIV3Document,
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

// Export guard functions
export {
  isOpenAPIV3_1Document,
  isOpenAPIV3Document,
  isReferenceObject,
} from "./types";

// Export HTTP utilities
export { isValidHTTPMethod, normalizeHTTPMethod } from "./utils/http";
export type { HTTPMethod } from "./utils/http";

// Export path utilities
export {
  buildPath,
  extractPathParams,
  isParameterizedPath,
  normalizePath,
} from "./utils/path";

// Export parser
export { parse, ParserError, XcgenParserError } from "./parser";
export type { OpenAPIParserOptions } from "./parser";

// Export transformer
export {
  extractRefName,
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
