/**
 * Valibot validation schema for RoleEnum
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for RoleEnum
 */
export const RoleEnumSchema = v.picklist(["admin", "user"]);