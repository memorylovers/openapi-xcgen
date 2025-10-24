/**
 * default service functions
 * Auto-generated from OpenAPI specification
 */

import { request } from "../client";
import type { XcgenApiError as _XcgenApiError } from "../client";
import type { User } from "../models/index";
export type { User } from "../models/index";

/**
 * Get users
 * @param init - Additional fetch options
 * @returns User
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function getUsers(
  init?: RequestInit,
): Promise<User> {
  return request({
    method: "GET",
    path: "/users",
    options: {},
    init,
  });
}
