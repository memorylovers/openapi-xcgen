/**
 * API service functions
 * Generated from: Validation Test API 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import { request } from "./client";
import type { XcgenApiError as _XcgenApiError } from "./client";
import type { CreateUserRequest, User } from "./types";
export type { CreateUserRequest, User } from "./types";

/**
 * Create a user
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns User
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function createUser(
  options: CreateUserRequest,
  init?: RequestInit,
): Promise<User> {
  return request({
    method: "POST",
    path: "/users",
    options,
    init,
  });
}
