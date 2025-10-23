/**
 * Valibot validation schemas
 * Generated from: OpenAPI 3.1.0 discriminator all of example 1.0.0
 * DO NOT EDIT - This file is auto-generated
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
