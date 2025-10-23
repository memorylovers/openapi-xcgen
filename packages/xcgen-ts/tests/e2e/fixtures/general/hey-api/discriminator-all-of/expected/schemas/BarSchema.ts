/**
 * Valibot validation schemas
 * Generated from: OpenAPI 3.1.0 discriminator all of example 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";
import { FooSchema } from './FooSchema';
import { BarAllOf1Schema } from './BarAllOf1Schema';

/**
 * Schema for Bar
 */
export const BarSchema = v.intersect([FooSchema, BarAllOf1Schema]);
