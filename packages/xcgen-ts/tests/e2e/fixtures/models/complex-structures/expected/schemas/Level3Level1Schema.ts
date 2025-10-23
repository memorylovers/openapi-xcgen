import * as v from "valibot";
import { Level3Level1Level2Schema } from './Level3Level1Level2Schema';

/**
 * Schema for Level3Level1
 */
export const Level3Level1Schema = v.object({
  level2: v.optional(Level3Level1Level2Schema),
});
