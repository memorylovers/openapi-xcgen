/**
 * @openapi-xcgen/generator-typescript
 *
 * TypeScript code generator for OpenAPI specifications
 */

// Main generator
export { generate } from "./generator.js";

// Types
export { defineConfig } from "./types.js";
export type {
  GeneratedFileType,
  GenerationResult,
  GeneratorOptions,
} from "./types.js";

// Generators (for advanced usage)
export { generateClient } from "./generators/client/client.js";
export { generateServices } from "./generators/services/services.js";
export { generateTypes } from "./generators/types/types.js";
