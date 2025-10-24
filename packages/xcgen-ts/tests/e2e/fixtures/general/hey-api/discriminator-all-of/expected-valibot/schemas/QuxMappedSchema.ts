/**
 * Valibot validation schema for QuxMapped
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { FooMappedSchema } from './FooMappedSchema';
import { QuxMappedAllOf1Schema } from './QuxMappedAllOf1Schema';

/**
 * Schema for QuxMapped
 */
export const QuxMappedSchema = v.intersect([FooMappedSchema, QuxMappedAllOf1Schema]);