/**
 * default service functions
 * Auto-generated from OpenAPI specification
 */

import { request } from "../client";
import type { XcgenApiError as _XcgenApiError } from "../client";
import type { GetPetsIdParams, GetPetsId200Response, GetUsersUserIdParams, GetUsersUserId200Response } from "../models/index";
export type { GetPetsIdParams, GetPetsId200Response, GetUsersUserIdParams, GetUsersUserId200Response } from "../models/index";

/**
 * Get pet by ID
 * Operation-level parameter overrides PathItem-level parameter
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns GetPetsId200Response
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function getPet(
  options: GetPetsIdParams,
  init?: RequestInit,
): Promise<GetPetsId200Response> {
  return request({
    method: "GET",
    path: "/pets/{id}",
    options,
    init,
  });
}

/**
 * Get user by ID
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns GetUsersUserId200Response
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function getUser(
  options: GetUsersUserIdParams,
  init?: RequestInit,
): Promise<GetUsersUserId200Response> {
  return request({
    method: "GET",
    path: "/users/{userId}",
    options,
    init,
  });
}
