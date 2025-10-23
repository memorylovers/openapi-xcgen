/**
 * Valibot validation schema for OrderCustomerAddress
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

export const OrderCustomerAddressSchema = v.object({
  street: v.optional(v.string()),
  city: v.optional(v.string()),
  country: v.optional(v.string()),
  zipCode: v.optional(v.pipe(v.string(), v.regex(/^\d{5}(-\d{4})?$/))),
});
