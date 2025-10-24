/**
 * Valibot validation schema for Pet
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for Pet
 */
export const PetSchema = v.object({
  id: v.number(),
  name: v.string(),
  tag: v.optional(v.string()),
});