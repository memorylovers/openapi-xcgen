/**
 * Valibot validation schemas
 * Generated from: OpenAPI 3.1.0 discriminator all of example 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";
import { FooMappedSchema } from './FooMappedSchema';
import { BazMappedAllOf1Schema } from './BazMappedAllOf1Schema';

/**
 * Schema for BazMapped
 */
export const BazMappedSchema = v.intersect([FooMappedSchema, BazMappedAllOf1Schema]);
