/**
 * Valibot validation schema for QuxMapped
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { FooMappedSchema } from './FooMappedSchema';
import { QuxMappedallOf1Schema } from './QuxMappedallOf1Schema';

/**
 * Schema for QuxMapped
 */
export const QuxMappedSchema = v.intersect([FooMappedSchema, QuxMappedallOf1Schema]);