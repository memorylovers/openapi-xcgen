/**
 * Valibot validation schema for Baz
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { BazallOf1Schema } from './BazallOf1Schema';
import { FooSchema } from './FooSchema';

/**
 * Schema for Baz
 */
export const BazSchema = v.intersect([FooSchema, BazallOf1Schema]);