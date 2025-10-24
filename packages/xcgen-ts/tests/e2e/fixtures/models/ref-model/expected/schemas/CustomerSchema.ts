/**
 * Valibot validation schema for Customer
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for Customer
 */
export const CustomerSchema = v.object({
  name: v.optional(v.string()),
});