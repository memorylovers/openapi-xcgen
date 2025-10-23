import * as v from "valibot";

/**
 * Schema for Level1Data
 */
export const Level1DataSchema = v.object({
  value: v.optional(v.string()),
});
