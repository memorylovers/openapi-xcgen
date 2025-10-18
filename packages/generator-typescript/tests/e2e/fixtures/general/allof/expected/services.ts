/**
 * API service functions
 * Generated from: allOf Composition Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import { request } from "./client";
import type { XcgenApiError as _XcgenApiError } from "./client";
import type { User } from "./types";
export type { User } from "./types";

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
