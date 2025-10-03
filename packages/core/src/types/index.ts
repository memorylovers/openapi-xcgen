// Type aliases
import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

export type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;
export type PathsObject = OpenAPIV3.PathsObject | OpenAPIV3_1.PathsObject;
export type PathItemObject =
  | OpenAPIV3.PathItemObject
  | OpenAPIV3_1.PathItemObject;
export type OperationObject =
  | OpenAPIV3.OperationObject
  | OpenAPIV3_1.OperationObject;
export type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;
export type SchemaObjectWithNullable = SchemaObject & { nullable?: boolean };
export type ReferenceObject =
  | OpenAPIV3.ReferenceObject
  | OpenAPIV3_1.ReferenceObject;
export type ParameterObject =
  | OpenAPIV3.ParameterObject
  | OpenAPIV3_1.ParameterObject;
export type HeaderObject = OpenAPIV3.HeaderObject | OpenAPIV3_1.HeaderObject;
export type RequestBodyObject =
  | OpenAPIV3.RequestBodyObject
  | OpenAPIV3_1.RequestBodyObject;
export type ResponseObject =
  | OpenAPIV3.ResponseObject
  | OpenAPIV3_1.ResponseObject;
export type ComponentsObject =
  | OpenAPIV3.ComponentsObject
  | OpenAPIV3_1.ComponentsObject;
export type SecuritySchemeObject =
  | OpenAPIV3.SecuritySchemeObject
  | OpenAPIV3_1.SecuritySchemeObject;
export type ServerObject = OpenAPIV3.ServerObject | OpenAPIV3_1.ServerObject;
export type InfoObject = OpenAPIV3.InfoObject | OpenAPIV3_1.InfoObject;
export type ContactObject = OpenAPIV3.ContactObject | OpenAPIV3_1.ContactObject;
export type LicenseObject = OpenAPIV3.LicenseObject | OpenAPIV3_1.LicenseObject;
export type TagObject = OpenAPIV3.TagObject | OpenAPIV3_1.TagObject;

// Re-export guard functions
export { isReferenceObject } from "./guards";

// Re-export IR types
export type {
  IRArray,
  IRArrayModel,
  IREndpoint,
  IREnumModel,
  IREnumValue,
  IRHttpMethod,
  IRMap,
  IRMapModel,
  IRMetadata,
  IRModel,
  IROAuth2SecurityScheme,
  IROAuthFlow,
  IROAuthFlows,
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
  IRSecurityRequirement,
  IRSecurityScheme,
  IRTag,
  IRType,
  IRValidation,
  MimeType,
  XcgenIR,
} from "./ir";
