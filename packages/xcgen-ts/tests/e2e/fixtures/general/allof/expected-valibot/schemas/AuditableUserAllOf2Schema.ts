/**
 * Valibot validation schema for AuditableUserallOf2
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { AuditableUserallOf2RoleSchema } from './AuditableUserallOf2RoleSchema';

/**
 * Schema for AuditableUserallOf2
 */
export const AuditableUserallOf2Schema = v.object({
  role: AuditableUserallOf2RoleSchema,
});