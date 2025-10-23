/**
 * Valibot validation schema for Timestamps
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

export const TimestampsSchema = v.object({
  createdAt: v.optional(v.pipe(v.string(), v.isoDateTime(), v.transform((val) => new Date(val)))),
  updatedAt: v.optional(v.pipe(v.string(), v.isoDateTime(), v.transform((val) => new Date(val)))),
});
