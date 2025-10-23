/**
 * Valibot validation schemas
 * Generated from: OpenAPI 3.1.0 discriminator all of example 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";
import { FooMappedSchema } from './FooMappedSchema';
import { QuxMappedAllOf1Schema } from './QuxMappedAllOf1Schema';

/**
 * Schema for QuxMapped
 */
export const QuxMappedSchema = v.intersect([FooMappedSchema, QuxMappedAllOf1Schema]);
