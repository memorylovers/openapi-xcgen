/**
 * Valibot validation schema for BazMapped
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { BazMappedallOf1Schema } from './BazMappedallOf1Schema';
import { FooMappedSchema } from './FooMappedSchema';

/**
 * Schema for BazMapped
 */
export const BazMappedSchema = v.intersect([FooMappedSchema, BazMappedallOf1Schema]);