/**
 * Valibot validation schema for GetPetsId200Response
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for GetPetsId200Response
 */
export const GetPetsId200ResponseSchema = v.object({
  id: v.optional(v.number()),
  name: v.optional(v.string()),
});