/**
 * Valibot validation schema for PostTest2RequestRequestBody
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { PostTest2RequestRequestBodyNestedSchema } from './PostTest2RequestRequestBodyNestedSchema';

/**
 * Schema for PostTest2RequestRequestBody
 */
export const PostTest2RequestRequestBodySchema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
  nested: v.optional(PostTest2RequestRequestBodyNestedSchema),
});