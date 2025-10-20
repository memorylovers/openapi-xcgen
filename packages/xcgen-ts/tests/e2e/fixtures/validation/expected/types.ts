/**
 * TypeScript type definitions
 * Generated from: Validation Test API 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

export interface User {
  /** Unique user identifier */ readonly id: string;
  /** Username (3-20 chars, alphanumeric and underscore) */ username: string;
  /** User email address */ email: string;
  /** User age (0-150 years) */ age?: number | null | undefined;
  /** User biography (max 500 chars) */ bio?: string | undefined;
  /** User website URL */ website?: string | null | undefined;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  age?: number | undefined;
  bio?: string | undefined;
  website?: string | undefined;
}
