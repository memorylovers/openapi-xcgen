import * as v from "valibot";
import { Level2OuterInnerSchema } from './Level2OuterInnerSchema';

/**
 * Schema for Level2Outer
 */
export const Level2OuterSchema = v.object({
  inner: v.optional(Level2OuterInnerSchema),
});
