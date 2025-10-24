/**
 * Valibot validation schema for FooUnion
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { BarUnionSchema } from './BarUnionSchema';
import { BazUnionSchema } from './BazUnionSchema';

/**
 * Schema for FooUnion
 */
export const FooUnionSchema = v.variant("id", [
  BarUnionSchema,
  BazUnionSchema,
]);