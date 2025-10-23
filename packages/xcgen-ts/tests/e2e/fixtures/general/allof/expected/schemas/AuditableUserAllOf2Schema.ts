/**
 * Valibot validation schema for AuditableUserAllOf2
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { AuditableUserAllOf2RoleSchema } from './AuditableUserAllOf2RoleSchema';

export const AuditableUserAllOf2Schema = v.object({
  role: AuditableUserAllOf2RoleSchema,
});
