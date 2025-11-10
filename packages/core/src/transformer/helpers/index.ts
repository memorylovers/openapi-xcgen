/**
 * Helper functions exports
 */

// Re-export from naming subdirectory (直接ファイルから)
export { buildAdditionalPropertiesComponentName } from "./naming/build-additional-properties-component-name";
export { buildInlineComponentName } from "./naming/build-inline-component-name";
export { buildParameterComponentName } from "./naming/build-parameter-component-name";
export { buildParameterSchemaComponentName } from "./naming/build-parameter-schema-component-name";
export { buildRequestBodyComponentName } from "./naming/build-request-body-component-name";
export { buildResponseComponentName } from "./naming/build-response-component-name";
export { generateEnumName } from "./naming/generate-enum-name";
export { getComponentName } from "./naming/get-component-name";
export { getMediaTypeSuffix } from "./naming/media-type-suffix";
export { pathToComponentBase } from "./naming/path-to-component-base";

// Re-export from path subdirectory (直接ファイルから)
export { buildComponentSchemaPath } from "./path/build-component-schema-path";
export { buildInlineSchemaPath } from "./path/build-inline-schema-path";
export { buildReferencePath } from "./path/build-reference-path";
export { parseCompositionPath } from "./path/parse-document-path";
export { parseParameterPath } from "./path/parse-document-path";
export { parseResponsePath } from "./path/parse-document-path";
export { parseRequestBodyPath } from "./path/parse-document-path";
export { parseAdditionalPropertiesPath } from "./path/parse-document-path";
export { parseSchemaPath } from "./path/parse-document-path";

// Utility functions (remain in helpers/)
export { enrichDiscriminatorMappings } from "./enrich-discriminator-mappings";
export { extractExtensions } from "./extract-extensions";
export { extractValidation } from "./extract-validation";
export { isNullable } from "./is-nullable";
export { toIRParameterInType } from "./to-ir-parameter-in-type";
export { toIRScalarType } from "./to-ir-scalar-type";
