/**
 * Valibot validation schema for OrderStatus
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

export const OrderStatusSchema = v.picklist(["pending", "processing", "shipped", "delivered", "cancelled"]);
