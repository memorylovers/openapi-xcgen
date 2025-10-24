/**
 * Valibot validation schema for GetTest3Response201ResponseItem
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { StatusEnumSchema } from './StatusEnumSchema';

/**
 * Schema for GetTest3Response201ResponseItem
 */
export const GetTest3Response201ResponseItemSchema = v.object({
  name: v.optional(v.string()),
  testStatus: v.optional(StatusEnumSchema),
  isActive: v.optional(v.boolean()),
});