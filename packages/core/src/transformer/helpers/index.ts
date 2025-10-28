/**
 * Helper functions exports
 */

// Re-export from naming subdirectory
export * from "./naming";

// Re-export from path subdirectory
export * from "./path";

// Utility functions (remain in helpers/)
export { createParameterModel } from "./create-parameter-model";
export { enrichDiscriminatorMappings } from "./enrich-discriminator-mappings";
export { extractExtensions } from "./extract-extensions";
export { extractValidation } from "./extract-validation";
export { isNullable } from "./is-nullable";
export { toIRParameterInType } from "./to-ir-parameter-in-type";
export { toIRScalarType } from "./to-ir-scalar-type";
