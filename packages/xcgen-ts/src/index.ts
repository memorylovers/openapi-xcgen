/**
 * @openapi-xcgen/generator-typescript
 *
 * TypeScript code generator for OpenAPI specifications
 */

// Main generator
export { generate } from "./generator";

// CLI
export { runCli } from "./cli";

// Types
export { defineConfig } from "./types";
export type {
  GeneratedFileType,
  GenerationResult,
  GeneratorOptions,
} from "./types";
export type {
  Hooks,
  PropertyGenerateContext,
  ParameterGenerateContext,
  ModelGenerateContext,
  EndpointGenerateContext,
  TypeTransformContext,
  ValidationTransformContext,
  TsCodeProperty,
  TsCodeParameter,
  TsCodeModel,
  TsCodeEndpoint,
  TsCodeType,
  TsCodeValidation,
} from "./hooks";

// Generators (for advanced usage)
export { generateClient } from "./generators/client/client";
export { generateServices } from "./generators/services/services";
export { generateTypes } from "./generators/types/types";
