/**
 * PatchUsersUserIdParams model
 * Auto-generated from OpenAPI specification
 */

import type { UserUpdate } from './UserUpdate';

/**
 * Parameters for PATCH /users/{userId}
 */
export interface PatchUsersUserIdParams {
  path: {
    userId: string;
  };
  body: UserUpdate;
}
