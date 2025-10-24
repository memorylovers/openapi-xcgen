/**
 * Valibot validation schema for GetTest3Response202Response
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { GetTest3Response202ResponseResultSchema } from './GetTest3Response202ResponseResultSchema';

/**
 * Schema for GetTest3Response202Response
 */
export const GetTest3Response202ResponseSchema = v.object({
  count: v.optional(v.number()),
  result: v.optional(GetTest3Response202ResponseResultSchema),
});