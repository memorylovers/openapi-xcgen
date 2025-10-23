/**
 * Valibot validation schema for OrderCustomer
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { OrderCustomerAddressSchema } from './OrderCustomerAddressSchema';

export const OrderCustomerSchema = v.object({
  id: v.string(),
  name: v.string(),
  email: v.optional(v.pipe(v.string(), v.email())),
  address: v.optional(OrderCustomerAddressSchema),
});
