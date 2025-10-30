/**
 * Valibot validation schema for Qux
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { FooSchema } from './FooSchema';
import { QuxallOf1Schema } from './QuxallOf1Schema';

/**
 * Schema for Qux
 */
export const QuxSchema = v.intersect([FooSchema, QuxallOf1Schema]);