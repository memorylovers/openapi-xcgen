/**
 * Valibot validation schema for User
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { BaseSchema } from './BaseSchema';
import { UserAllOf1Schema } from './UserAllOf1Schema';

/**
 * Schema for User
 */
export const UserSchema = v.intersect([BaseSchema, UserAllOf1Schema]);