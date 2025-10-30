/**
 * Valibot validation schema for User
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { BaseSchema } from './BaseSchema';
import { UserallOf1Schema } from './UserallOf1Schema';

/**
 * Schema for User
 */
export const UserSchema = v.intersect([BaseSchema, UserallOf1Schema]);