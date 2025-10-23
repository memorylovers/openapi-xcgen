import * as v from "valibot";

/**
 * Schema for TeamMembersItem
 */
export const TeamMembersItemSchema = v.object({
  name: v.optional(v.string()),
});
