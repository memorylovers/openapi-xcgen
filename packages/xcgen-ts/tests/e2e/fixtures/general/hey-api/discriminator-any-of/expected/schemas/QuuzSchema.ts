/**
 * Valibot validation schema for Quuz
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { BarSchema } from './BarSchema';
import { BazSchema } from './BazSchema';
import { SpC3A6CialSchema } from './SpC3A6CialSchema';

/**
 * Schema for Quuz
 */
export const QuuzSchema = v.union([BarSchema, BazSchema, SpC3A6CialSchema]);