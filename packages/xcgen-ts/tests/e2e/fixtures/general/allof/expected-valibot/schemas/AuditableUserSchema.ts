/**
 * Valibot validation schema for AuditableUser
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { AuditableUserallOf2Schema } from './AuditableUserallOf2Schema';
import { BaseSchema } from './BaseSchema';
import { TimestampsSchema } from './TimestampsSchema';

/**
 * Schema for AuditableUser
 * User with audit timestamps
 */
export const AuditableUserSchema = v.intersect([BaseSchema, TimestampsSchema, AuditableUserallOf2Schema]);