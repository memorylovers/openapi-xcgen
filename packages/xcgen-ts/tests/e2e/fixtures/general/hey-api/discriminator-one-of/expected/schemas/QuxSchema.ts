/**
 * Valibot validation schemas
 * Generated from: OpenAPI 3.1.0 discriminator one of example 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";
import { QuuxSchema } from './QuuxSchema';

/**
 * Schema for Qux
 */
export const QuxSchema = v.object({
  id: v.string(),
  type: QuuxSchema,
});
