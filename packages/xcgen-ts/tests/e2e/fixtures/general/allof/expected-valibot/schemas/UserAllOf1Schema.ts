/**
 * Valibot validation schema for UserallOf1
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for UserallOf1
 */
export const UserallOf1Schema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
});