import * as v from "valibot";
import { Level3Level1Schema } from './Level3Level1Schema';

/**
 * Schema for Level3
 */
export const Level3Schema = v.object({
  level1: v.optional(Level3Level1Schema),
});
