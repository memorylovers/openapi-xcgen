/**
 * Valibot validation schema for Qux
 * Auto-generated from OpenAPI specification
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