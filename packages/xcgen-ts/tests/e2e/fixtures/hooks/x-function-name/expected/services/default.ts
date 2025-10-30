/**
 * default service functions
 * Auto-generated from OpenAPI specification
 */

import { request } from "../client";
import type { XcgenApiError as _XcgenApiError } from "../client";
import type { Schema, CreateUserRequest, User, GetUsersUserIdParams } from "../models/index";
export type { Schema, CreateUserRequest, User, GetUsersUserIdParams } from "../models/index";

/**
 * Get all users
 * @param init - Additional fetch options
 * @returns Schema
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function getUsers(
  init?: RequestInit,
): Promise<Schema> {
  return request({
    method: "GET",
    path: "/users",
    options: {},
    init,
  });
}

/**
 * Create a new user
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

/**
 * Get user by ID (no custom name)
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns User
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function getUserById(
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
