/**
 * default service functions
 * Auto-generated from OpenAPI specification
 */

import { request } from "../client";
import type { XcgenApiError as _XcgenApiError } from "../client";
import type { GetTest1ParametersIdParams, Schema, GetTest3ResponseParams } from "../models/index";
export type { GetTest1ParametersIdParams, Schema, GetTest3ResponseParams } from "../models/index";

/**
 * Test 1: Parameters model generation (Basic)
 * Validates parameter model generation with all parameter types (path/query/header/cookie). Tests: enum parameters, required/optional mixing, default values, parameter type conversion.
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns Schema
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function testParametersModelGeneration(
  options: GetTest1ParametersIdParams,
  init?: RequestInit,
): Promise<Schema> {
  return request({
    method: "GET",
    path: "/test-1-parameters/{id}",
    options,
    init,
  });
}

/**
 * Test 2: Request body inline schema extraction (Basic)
 * Validates extraction of inline schemas from request body into separate models. Tests: required fields, nested object extraction, format validation.
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns Schema
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function testRequestInlineExtraction(
  options: Schema,
  init?: RequestInit,
): Promise<Schema> {
  return request({
    method: "POST",
    path: "/test-2-request",
    options,
    init,
  });
}

/**
 * Test 3: Response inline schema extraction (Intermediate)
 * Validates extraction of inline schemas from response body into separate models. Tests: array items extraction, enum extraction, parameter model generation.
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns string
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function testResponseInlineExtraction(
  options: GetTest3ResponseParams,
  init?: RequestInit,
): Promise<string> {
  return request({
    method: "GET",
    path: "/test-3-response",
    options,
    init,
  });
}
