import * as v from "valibot";

/**
 * Schema for User
 */
export const UserSchema = v.object({
  name: v.optional(v.string()),
});
