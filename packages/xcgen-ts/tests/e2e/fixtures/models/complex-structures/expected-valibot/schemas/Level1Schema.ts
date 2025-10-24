/**
 * Valibot validation schema for Level1
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { Level1DataSchema } from './Level1DataSchema';

/**
 * Schema for Level1
 */
export const Level1Schema = v.object({
  data: v.optional(Level1DataSchema),
});