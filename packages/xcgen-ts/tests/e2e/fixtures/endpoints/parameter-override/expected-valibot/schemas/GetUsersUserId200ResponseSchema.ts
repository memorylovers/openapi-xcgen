/**
 * Valibot validation schema for GetUsersUserId200Response
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for GetUsersUserId200Response
 */
export const GetUsersUserId200ResponseSchema = v.object({
  id: v.optional(v.string()),
  name: v.optional(v.string()),
});