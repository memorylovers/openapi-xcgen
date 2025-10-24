/**
 * Valibot validation schema for OrderPriority
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for OrderPriority
 */
export const OrderPrioritySchema = v.picklist(["low", "normal", "high", "urgent"]);