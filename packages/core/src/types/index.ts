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
export type ContactObject = OpenAPIV3_1.ContactObject;
export type LicenseObject = OpenAPIV3_1.LicenseObject;
export type TagObject = OpenAPIV3_1.TagObject;

// Re-export guard functions
export { isReferenceObject } from "./guards";

// Re-export IR types
export type {
  IRApiKeyConfig,
  IRArray,
  IRArrayModel,
  IRContact,
  IREndpoint,
  IREnumModel,
  IREnumValue,
  IRHttpMethod,
  IRLicense,
  IRMap,
  IRMapModel,
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
  MimeType,
  XcgenIR,
} from "./ir";
