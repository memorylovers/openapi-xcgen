/**
 * Valibot validation schemas
 * Generated from: OpenAPI 3.0.3 discriminator any of example 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";
import { BarSchema } from './BarSchema';
import { BazSchema } from './BazSchema';

/**
 * Schema for Foo
 */
export const FooSchema = v.union([BarSchema, BazSchema]);
