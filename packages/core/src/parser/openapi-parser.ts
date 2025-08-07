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
 * Parser for OpenAPI specifications
 * Handles parsing, validation, and dereferencing of OpenAPI documents
 */
export class OpenAPIParser {
  private readonly basePath: string;
  private readonly swaggerParser: SwaggerParser;

  /**
   * Creates a new OpenAPIParser instance
   * @param options - Parser options
   */
  constructor(options?: OpenAPIParserOptions) {
    this.basePath = options?.basePath ?? process.cwd();
    this.swaggerParser = new SwaggerParser();
  }

  /**
   * Parse an OpenAPI document from a YAML file
   * @param filePath - Path to the OpenAPI YAML file
   * @returns Parsed and resolved OpenAPI document with all $refs dereferenced
   * @throws {XcgenParserError} If parsing fails
   */
  async parse(filePath: string): Promise<OpenAPIDocument> {
    try {
      // Resolve the file path
      const resolvedPath = resolve(this.basePath, filePath);

      // Parse, validate, and dereference in one step
      const api = await this.swaggerParser.dereference(resolvedPath);

      // Check OpenAPI version
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const openapiVersion = (api as any).openapi;

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
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      throw createParseFailedError(errorMessage, filePath, error);
    }
  }
}
