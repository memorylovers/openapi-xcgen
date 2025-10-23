/**
 * Valibot validation schemas
 * Generated from: OpenAPI 3.1.0 discriminator all of example 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";
import { FooSchema } from './FooSchema';
import { BazAllOf1Schema } from './BazAllOf1Schema';

/**
 * Schema for Baz
 */
export const BazSchema = v.intersect([FooSchema, BazAllOf1Schema]);
