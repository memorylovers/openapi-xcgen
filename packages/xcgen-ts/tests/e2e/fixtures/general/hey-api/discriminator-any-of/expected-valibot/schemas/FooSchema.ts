/**
 * Valibot validation schema for Foo
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { BarSchema } from './BarSchema';
import { BazSchema } from './BazSchema';

/**
 * Schema for Foo
 */
export const FooSchema = v.union([BarSchema, BazSchema]);