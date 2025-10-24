/**
 * Valibot validation schema for UserResponse
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { UserProfileSchema } from './UserProfileSchema';

/**
 * Schema for UserResponse
 */
export const UserResponseSchema = v.object({
  id: v.optional(v.string()),
  name: v.optional(v.string()),
  profile: v.optional(UserProfileSchema),
});