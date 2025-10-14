/**
 * API service functions
 * Generated from: Inline Schemas Test API 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import { request } from "./client.js";
import type { XcgenApiError } from "./client.js";
import type { GetTest1ParametersIdParams, GetTest1ParametersId200Response, PostTest2RequestRequestBody, PostTest2Request201Response, GetTest3ResponseParams, GetTest3Response201Response, GetTest3Response202Response, UserResponse } from "./types.js";

/**
 * Test 1: Parameters model generation (Basic)
 * Validates parameter model generation with all parameter types (path/query/header/cookie). Tests: enum parameters, required/optional mixing, default values, parameter type conversion.
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns GetTest1ParametersId200Response
 * @throws {XcgenApiError} API error with status and response details
 */
export async function testParametersModelGeneration(
  options: GetTest1ParametersIdParams,
  init?: RequestInit,
): Promise<GetTest1ParametersId200Response> {
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
 * @returns PostTest2Request201Response
 * @throws {XcgenApiError} API error with status and response details
 */
export async function testRequestInlineExtraction(
  options: PostTest2RequestRequestBody,
  init?: RequestInit,
): Promise<PostTest2Request201Response> {
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
 * @throws {XcgenApiError} API error with status and response details
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
