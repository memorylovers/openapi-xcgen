/**
 * Valibot validation schema for Baz
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { BazAllOf1Schema } from './BazAllOf1Schema';
import { FooSchema } from './FooSchema';

/**
 * Schema for Baz
 */
export const BazSchema = v.intersect([FooSchema, BazAllOf1Schema]);