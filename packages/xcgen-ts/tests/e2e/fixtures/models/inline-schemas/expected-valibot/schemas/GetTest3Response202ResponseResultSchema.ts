/**
 * Valibot validation schema for GetTest3Response202ResponseResult
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { GetTest3Response202ResponseResultStatusSchema } from './GetTest3Response202ResponseResultStatusSchema';

/**
 * Schema for GetTest3Response202ResponseResult
 */
export const GetTest3Response202ResponseResultSchema = v.object({
  status: v.optional(GetTest3Response202ResponseResultStatusSchema),
});