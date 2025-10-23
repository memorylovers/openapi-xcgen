/**
 * Valibot validation schema for OrderItems
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { OrderItemsItemSchema } from './OrderItemsItemSchema';

export const OrderItemsSchema = v.array(OrderItemsItemSchema);
