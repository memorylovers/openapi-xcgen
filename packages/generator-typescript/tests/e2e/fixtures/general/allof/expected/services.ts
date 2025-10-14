/**
 * API service functions
 * Generated from: allOf Composition Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import { request } from "./client.js";
import type { XcgenApiError } from "./client.js";
import type { User } from "./types.js";

/**
 * Get users
 * @param init - Additional fetch options
 * @returns User
 * @throws {XcgenApiError} API error with status and response details
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
