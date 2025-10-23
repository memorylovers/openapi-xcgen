/**
 * Valibot validation schemas
 * Generated from: Ref Model Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";
import { CustomerSchema } from './CustomerSchema';

/**
 * Schema for GetCustomers200Response
 */
export const GetCustomers200ResponseSchema = v.array(CustomerSchema);
