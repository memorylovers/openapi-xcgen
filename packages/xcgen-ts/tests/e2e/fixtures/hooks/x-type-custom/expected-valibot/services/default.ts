/**
 * default service functions
 * Auto-generated from OpenAPI specification
 */

import { request } from "../client";
import type { XcgenApiError as _XcgenApiError } from "../client";
import type { GetUsersUserIdParams, User } from "../models/index";
export type { GetUsersUserIdParams, User } from "../models/index";

/**
 * Get user by ID
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns User
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function getUser(
  options: GetUsersUserIdParams,
  init?: RequestInit,
): Promise<User> {
  return request({
    method: "GET",
    path: "/users/{userId}",
    options,
    init,
  });
}
