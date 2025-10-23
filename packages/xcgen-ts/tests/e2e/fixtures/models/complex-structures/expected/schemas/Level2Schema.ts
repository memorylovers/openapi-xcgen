import * as v from "valibot";
import { Level2OuterSchema } from './Level2OuterSchema';

/**
 * Schema for Level2
 */
export const Level2Schema = v.object({
  outer: v.optional(Level2OuterSchema),
});
