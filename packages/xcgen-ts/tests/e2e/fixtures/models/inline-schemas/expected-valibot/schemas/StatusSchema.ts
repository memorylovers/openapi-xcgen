/**
 * Valibot validation schema for Status
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for Status
 */
export const StatusSchema = v.picklist(["active", "inactive", "pending"]);