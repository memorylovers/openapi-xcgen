/**
 * Valibot validation schema for Bar
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { BarallOf1Schema } from './BarallOf1Schema';
import { FooSchema } from './FooSchema';

/**
 * Schema for Bar
 */
export const BarSchema = v.intersect([FooSchema, BarallOf1Schema]);