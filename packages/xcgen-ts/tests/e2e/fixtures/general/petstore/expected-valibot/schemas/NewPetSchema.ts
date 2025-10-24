/**
 * Valibot validation schema for NewPet
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for NewPet
 */
export const NewPetSchema = v.object({
  name: v.string(),
  tag: v.optional(v.string()),
});