import * as v from "valibot";
import { Level3Level1Level2Level3Schema } from './Level3Level1Level2Level3Schema';

/**
 * Schema for Level3Level1Level2
 */
export const Level3Level1Level2Schema = v.object({
  level3: v.optional(Level3Level1Level2Level3Schema),
});
