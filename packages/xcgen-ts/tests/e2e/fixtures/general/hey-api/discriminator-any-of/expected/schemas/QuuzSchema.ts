/**
 * Valibot validation schemas
 * Generated from: OpenAPI 3.0.3 discriminator any of example 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";
import { BarSchema } from './BarSchema';
import { BazSchema } from './BazSchema';
import { SpC3A6CialSchema } from './SpæcialSchema';

/**
 * Schema for Quuz
 */
export const QuuzSchema = v.union([BarSchema, BazSchema, SpC3A6CialSchema]);
