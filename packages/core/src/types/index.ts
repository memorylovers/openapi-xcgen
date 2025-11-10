// Import types for backward compatibility aliases
import type {
  IRAllOfSchema,
  IRAnyOfSchema,
  IRArraySchema,
  IRComponent,
  IREnumSchema,
  IRMapSchema,
  IRObjectSchema,
  IRParameterComponent,
  IRRequestBodyComponent,
  IRResponseComponent,
  IRUnionSchema,
} from "./ir";

// Re-export OpenAPI type aliases
export type {
  OpenAPIDocument,
  PathsObject,
  PathItemObject,
  OperationObject,
  SchemaObject,
  SchemaObjectWithNullable,
  ReferenceObject,
  ParameterObject,
  HeaderObject,
  RequestBodyObject,
  ResponseObject,
  ComponentsObject,
  SecuritySchemeObject,
  ServerObject,
  InfoObject,
  ContactObject,
  LicenseObject,
  TagObject,
  ArraySchemaObject,
  NonArraySchemaObject,
  BaseSchemaObject,
  ArraySchemaObjectType,
  NonArraySchemaObjectType,
} from "./openapi-types";

// Re-export guard functions
export {
  isReferenceObject,
  isArraySchemaObject,
  isNonArraySchemaObject,
  isObjectSchemaObject,
  isEnumSchema,
  isCompositionSchema,
  isMapSchema,
  isPrimitiveSchema,
} from "./guards";

// Re-export IR types
export type {
  IRExtensions,
  IRExtensionValue,
  IRAllOfSchema,
  IRAnyOfSchema,
  IRArraySchema,
  IRComponent,
  IRDiscriminator,
  IREndpoint,
  IREnumSchema,
  IREnumValue,
  IRHttpMethod,
  IRMapSchema,
  IRMetadata,
  IRObjectSchema,
  IROperationComponent,
  IROAuth2SecurityScheme,
  IROAuthFlow,
  IROAuthFlows,
  IRParameter,
  IRParameterInType,
  IRParameterComponent,
  IRParameterProperty,
  IRProperty,
  IRRef,
  IRRequestBody,
  IRRequestBodyComponent,
  IRRequestContent,
  IRResponse,
  IRResponseContent,
  IRResponseHeader,
  IRResponseComponent,
  IRScalarType,
  IRSchema,
  IRSecurityRequirement,
  IRSecurityScheme,
  IRServer,
  IRServerVariable,
  IRTag,
  IRType,
  IRUnionSchema,
  IRValidation,
  MimeType,
  XcgenIR,
} from "./ir";

// ============================================================================
// Backward compatibility aliases (deprecated)
// These will be removed in a future version after xcgen-ts migration
// ============================================================================

/** @deprecated Use IRComponent instead. Will be removed after Task 025 Phase 2. */
export type IRModel = IRComponent;

/** @deprecated Use IRObjectSchema instead. Will be removed after Task 025 Phase 2. */
export type IRObjectModel = IRObjectSchema;

/** @deprecated Use IREnumSchema instead. Will be removed after Task 025 Phase 2. */
export type IREnumModel = IREnumSchema;

/** @deprecated Use IRArraySchema instead. Will be removed after Task 025 Phase 2. */
export type IRArrayModel = IRArraySchema;

/** @deprecated Use IRMapSchema instead. Will be removed after Task 025 Phase 2. */
export type IRMapModel = IRMapSchema;

/** @deprecated Use IRAllOfSchema instead. Will be removed after Task 025 Phase 2. */
export type IRAllOfModel = IRAllOfSchema;

/** @deprecated Use IRAnyOfSchema instead. Will be removed after Task 025 Phase 2. */
export type IRAnyOfModel = IRAnyOfSchema;

/** @deprecated Use IRUnionSchema instead. Will be removed after Task 025 Phase 2. */
export type IRUnionModel = IRUnionSchema;

/** @deprecated Use IRParameterComponent instead. Will be removed after Task 025 Phase 2. */
export type IRParameterModel = IRParameterComponent;

/** @deprecated Use IRRequestBodyComponent instead. Will be removed after Task 025 Phase 2. */
export type IRRequestBodyModel = IRRequestBodyComponent;

/** @deprecated Use IRResponseComponent instead. Will be removed after Task 025 Phase 2. */
export type IRResponseModel = IRResponseComponent;
