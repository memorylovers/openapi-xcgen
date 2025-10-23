import * as v from "valibot";
import { RoleEnumSchema } from './RoleEnumSchema';

/**
 * Schema for PostTest2RequestRequestBodyNested
 */
export const PostTest2RequestRequestBodyNestedSchema = v.object({
  value: v.optional(v.string()),
  count: v.optional(v.number()),
  role: v.optional(RoleEnumSchema),
});
