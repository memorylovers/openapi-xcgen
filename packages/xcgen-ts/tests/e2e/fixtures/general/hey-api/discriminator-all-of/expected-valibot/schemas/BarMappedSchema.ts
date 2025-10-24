/**
 * Valibot validation schema for BarMapped
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { BarMappedAllOf1Schema } from './BarMappedAllOf1Schema';
import { FooMappedSchema } from './FooMappedSchema';

/**
 * Schema for BarMapped
 */
export const BarMappedSchema = v.intersect([FooMappedSchema, BarMappedAllOf1Schema]);