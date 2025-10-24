/**
 * User model
 * Auto-generated from OpenAPI specification
 */

export interface User {
  /** Unique user identifier */ readonly id: string;
  /** Username (3-20 chars, alphanumeric and underscore) */ username: string;
  /** User email address */ email: string;
  /** User age (0-150 years) */ age?: number | null | undefined;
  /** User biography (max 500 chars) */ bio?: string | undefined;
  /** User website URL */ website?: string | null | undefined;
}