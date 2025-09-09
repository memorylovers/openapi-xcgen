// Re-export from openapi-types
export type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

// Type aliases
import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

export type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;
export type OpenAPIV3Document = OpenAPIV3_1.Document;
export type PathsObject = OpenAPIV3_1.PathsObject;
export type PathItemObject = OpenAPIV3_1.PathItemObject;
export type OperationObject = OpenAPIV3_1.OperationObject;
export type SchemaObject = OpenAPIV3_1.SchemaObject;
export type SchemaObjectWithNullable = SchemaObject & { nullable?: boolean };
export type ReferenceObject = OpenAPIV3_1.ReferenceObject;
export type ParameterObject = OpenAPIV3_1.ParameterObject;
export type RequestBodyObject = OpenAPIV3_1.RequestBodyObject;
export type ResponseObject = OpenAPIV3_1.ResponseObject;
export type ComponentsObject = OpenAPIV3_1.ComponentsObject;
export type SecuritySchemeObject = OpenAPIV3_1.SecuritySchemeObject;
export type ServerObject = OpenAPIV3_1.ServerObject;
export type InfoObject = OpenAPIV3_1.InfoObject;
export type TagObject = OpenAPIV3_1.TagObject;

// Re-export guard functions
export {
  isOpenAPIV3_1Document,
  isOpenAPIV3Document,
  isReferenceObject,
} from "./guards";

// Re-export IR types
export type {
  IRApiKeyConfig,
  IRArray,
  IRContact,
  IRContentMap,
  IREndpoint,
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
  IRProperty,
  IRRef,
  IRRequestBody,
  IRResponse,
  IRResponseHeader,
  IRResponseHeaderMap,
  IRSecurityScheme,
  IRServer,
  IRServerVariable,
  IRServerVariableMap,
  IRService,
  IRType,
  IRValidation,
  MimeType,
  XcgenIR,
} from "./ir/index";
