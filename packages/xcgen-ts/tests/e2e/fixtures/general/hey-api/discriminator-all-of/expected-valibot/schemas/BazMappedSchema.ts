/**
 * Valibot validation schema for BazMapped
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { BazMappedAllOf1Schema } from './BazMappedAllOf1Schema';
import { FooMappedSchema } from './FooMappedSchema';

/**
 * Schema for BazMapped
 */
export const BazMappedSchema = v.intersect([FooMappedSchema, BazMappedAllOf1Schema]);