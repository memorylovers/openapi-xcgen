/**
 * Valibot validation schema for OrderItems
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { OrderItemsItemSchema } from './OrderItemsItemSchema';

/**
 * Schema for OrderItems
 */
export const OrderItemsSchema = v.pipe(v.array(OrderItemsItemSchema), v.minLength(1));