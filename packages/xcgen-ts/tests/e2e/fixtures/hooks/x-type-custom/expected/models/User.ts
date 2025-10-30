/**
 * User model
 * Auto-generated from OpenAPI specification
 */

export interface User {
  /** User ID */ userId: string;
  /** Email address */ email: string;
  /** Username (no custom type) */ username: string;
  /** Optional phone number */ phoneNumber?: string | undefined;
}