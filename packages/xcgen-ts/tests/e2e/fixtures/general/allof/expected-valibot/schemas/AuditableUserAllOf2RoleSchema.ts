/**
 * Valibot validation schema for AuditableUserallOf2Role
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for AuditableUserallOf2Role
 */
export const AuditableUserallOf2RoleSchema = v.picklist(["admin", "user", "guest"]);