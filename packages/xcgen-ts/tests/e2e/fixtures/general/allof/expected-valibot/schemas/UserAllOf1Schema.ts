/**
 * Valibot validation schema for UserAllOf1
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for UserAllOf1
 */
export const UserAllOf1Schema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
});