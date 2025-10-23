/**
 * Valibot validation schema for AuditableUserAllOf2Role
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

export const AuditableUserAllOf2RoleSchema = v.picklist(["admin", "user", "guest"]);
