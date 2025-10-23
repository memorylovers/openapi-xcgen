/**
 * Valibot validation schemas
 * Generated from: OpenAPI 3.1.0 discriminator all of example 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";
import { FooSchema } from './FooSchema';
import { QuxAllOf1Schema } from './QuxAllOf1Schema';

/**
 * Schema for Qux
 */
export const QuxSchema = v.intersect([FooSchema, QuxAllOf1Schema]);
