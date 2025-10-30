/**
 * Valibot validation schema for OrderCustomer
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { OrderCustomerAddressSchema } from './OrderCustomerAddressSchema';

/**
 * Schema for OrderCustomer
 */
export const OrderCustomerSchema = v.object({
  id: v.string(),
  name: v.string(),
  email: v.optional(v.string()),
  address: v.optional(OrderCustomerAddressSchema),
});