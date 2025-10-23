/**
 * Valibot validation schemas
 * Generated from: OpenAPI 3.1.0 discriminator all of example 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";
import { FooMappedSchema } from './FooMappedSchema';
import { BarMappedAllOf1Schema } from './BarMappedAllOf1Schema';

/**
 * Schema for BarMapped
 */
export const BarMappedSchema = v.intersect([FooMappedSchema, BarMappedAllOf1Schema]);
