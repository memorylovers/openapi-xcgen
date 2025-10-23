import * as v from "valibot";

/**
 * Schema for StatusEnum
 */
export const StatusEnumSchema = v.picklist(["active", "inactive"]);
