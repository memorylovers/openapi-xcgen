import * as v from "valibot";
import { Level1DataSchema } from './Level1DataSchema';

/**
 * Schema for Level1
 */
export const Level1Schema = v.object({
  data: v.optional(Level1DataSchema),
});
