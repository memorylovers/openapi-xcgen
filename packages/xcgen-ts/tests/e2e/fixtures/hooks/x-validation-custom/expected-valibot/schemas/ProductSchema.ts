/**
 * Valibot validation schema for Product
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { validateBusinessEmail, validatePositivePrice, validateSKUFormat } from "../_userdefs"

/**
 * Schema for Product
 */
export const ProductSchema = v.object({
  sku: v.pipe(v.string(), v.minLength(3), v.maxLength(20), v.regex(/^[A-Z0-9-]+$/), v.custom(validateSKUFormat)),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  price: v.pipe(v.number(), v.minValue(0), v.custom(validatePositivePrice)),
  email: v.optional(v.pipe(v.string(), v.email(), v.custom(validateBusinessEmail))),
});