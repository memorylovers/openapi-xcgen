/**
 * UserCreate model
 * Auto-generated from OpenAPI specification
 */

/**
 * User creation model with writeOnly fields
 */
export interface UserCreate {
  /** Username */ username: string;
  /** Email address */ email: string;
  /** Password (not returned in responses) */ password: string;
  /** Password confirmation */ confirmPassword: string;
}