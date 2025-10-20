/**
 * API service functions
 * Generated from: ReadOnly/WriteOnly Test API 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import { request } from "./client";
import type { XcgenApiError as _XcgenApiError } from "./client";
import type { UserCreate, User, GetUsersUserIdParams, PatchUsersUserIdParams } from "./types";
export type { UserCreate, User, GetUsersUserIdParams, PatchUsersUserIdParams } from "./types";

/**
 * Create a new user
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns User
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function createUser(
  options: UserCreate,
  init?: RequestInit,
): Promise<User> {
  return request({
    method: "POST",
    path: "/users",
    options,
    init,
  });
}

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

/**
 * Update user
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns User
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function updateUser(
  options: PatchUsersUserIdParams,
  init?: RequestInit,
): Promise<User> {
  return request({
    method: "PATCH",
    path: "/users/{userId}",
    options,
    init,
  });
}
