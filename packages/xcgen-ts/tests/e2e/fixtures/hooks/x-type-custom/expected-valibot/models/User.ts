/**
 * User model
 * Auto-generated from OpenAPI specification
 */

import type { EmailAddress, PhoneNumber, UserId } from "../_userdefs"

export interface User {
  /** User ID */ userId: UserId;
  /** Email address */ email: EmailAddress;
  /** Username (no custom type) */ username: string;
  /** Optional phone number */ phoneNumber?: PhoneNumber | undefined;
}