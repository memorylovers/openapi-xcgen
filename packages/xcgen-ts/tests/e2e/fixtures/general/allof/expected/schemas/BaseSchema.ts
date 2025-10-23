/**
 * Valibot validation schema for Base
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

export const BaseSchema = v.object({
  id: v.string(),
  createdAt: v.optional(v.pipe(v.string(), v.isoDateTime(), v.transform((val) => new Date(val)))),
});
