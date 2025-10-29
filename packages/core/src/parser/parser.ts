import SwaggerParser from "@apidevtools/swagger-parser";
import process from "node:process";
import { resolve } from "pathe";
import type { OpenAPIDocument } from "../types";
import { XcgenParserError } from "./error";
import {
  createInvalidVersionError,
  createParseFailedError,
} from "./error-helpers";

/**
 * Options for OpenAPIParser
 */
export interface OpenAPIParserOptions {
  /**
   * Base path for resolving relative references
   * @default process.cwd()
   */
  basePath?: string;
}

/**
 * Parse an OpenAPI document from a YAML file
 * @param filePath - Path to the OpenAPI YAML file
 * @param options - Parser options
 * @returns Parsed and resolved OpenAPI document with all $refs dereferenced
 * @throws {XcgenParserError} If parsing fails
 */
export async function parse(
  filePath: string,
  options?: OpenAPIParserOptions,
): Promise<OpenAPIDocument> {
  try {
    // Get base path from options or use current working directory
    const basePath = options?.basePath ?? process.cwd();

    // Create a new SwaggerParser instance
    const swaggerParser = new SwaggerParser();

    // Resolve the file path
    const resolvedPath = resolve(basePath, filePath);

    // Parse, validate, and bundle (keeps internal $refs)
    const api = await swaggerParser.bundle(resolvedPath);

    // Check OpenAPI version
    // swagger-parserの型定義が不完全なため、型ガードを使用
    const openapiVersion =
      typeof api === "object" &&
      api !== null &&
      "openapi" in api &&
      typeof api.openapi === "string"
        ? api.openapi
        : undefined;

    // Ensure it's OpenAPI 3.x
    if (!openapiVersion || !openapiVersion.startsWith("3.")) {
      throw createInvalidVersionError(openapiVersion, filePath);
    }

    return api as OpenAPIDocument;
  } catch (error) {
    // If it's already our error, re-throw it
    if (error instanceof XcgenParserError) {
      throw error;
    }

    // Convert swagger-parser errors to our error type
    const errorMessage = error instanceof Error ? error.message : String(error);

    throw createParseFailedError(errorMessage, filePath, error);
  }
}
