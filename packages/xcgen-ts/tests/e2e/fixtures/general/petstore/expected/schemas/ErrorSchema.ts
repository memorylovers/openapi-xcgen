/**
 * Valibot validation schema for Error
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

export const ErrorSchema = v.object({
  code: v.number(),
  message: v.string(),
});
