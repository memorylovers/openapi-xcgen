/**
 * Helper functions exports
 */

// Re-export from naming subdirectory (直接ファイルから)
export { buildAdditionalPropertiesModelName } from "./naming/build-additional-properties-model-name";
export { buildInlineModelName } from "./naming/build-inline-model-name";
export { buildParameterModelName } from "./naming/build-parameter-model-name";
export { buildParameterSchemaModelName } from "./naming/build-parameter-schema-model-name";
export { buildRequestBodyModelName } from "./naming/build-request-body-model-name";
export { buildResponseModelName } from "./naming/build-response-model-name";
export { generateEnumName } from "./naming/generate-enum-name";
export { getModelName } from "./naming/get-model-name";
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
export { createParameterModel } from "./create-parameter-model";
export { enrichDiscriminatorMappings } from "./enrich-discriminator-mappings";
export { extractExtensions } from "./extract-extensions";
export { extractValidation } from "./extract-validation";
export { isNullable } from "./is-nullable";
export { toIRParameterInType } from "./to-ir-parameter-in-type";
export { toIRScalarType } from "./to-ir-scalar-type";
