/**
 * Valibot validation schema for OrderItems
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { OrderItemSchema } from './OrderItemSchema';

/**
 * Schema for OrderItems
 */
export const OrderItemsSchema = v.array(OrderItemSchema);