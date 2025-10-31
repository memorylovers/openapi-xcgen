/**
 * GetUsersUserIdParams model
 * Auto-generated from OpenAPI specification
 */

import type { Format } from './Format';

/**
 * Parameters for GET /users/{userId}
userId: User ID (PathItem level)
format: Response format (Operation level - extended)
 */
export interface GetUsersUserIdParams {
  path: {
    /** User ID (PathItem level) */ userId: string;
  };
  query: {
    /** Response format (Operation level - extended) */ format?: Format | undefined;
  };
}