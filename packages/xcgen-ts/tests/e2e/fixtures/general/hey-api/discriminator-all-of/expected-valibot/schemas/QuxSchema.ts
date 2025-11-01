/**
 * Valibot validation schema for Qux
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { FooSchema } from './FooSchema';
import { QuxAllOf1Schema } from './QuxAllOf1Schema';

/**
 * Schema for Qux
 */
export const QuxSchema = v.intersect([FooSchema, QuxAllOf1Schema]);