/**
 * User service functions
 * Auto-generated from OpenAPI specification
 */

import { request } from '../client';
import type { XcgenApiError as _XcgenApiError } from '../client';
import type { CreateUserRequest, User } from '../models/index';

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
