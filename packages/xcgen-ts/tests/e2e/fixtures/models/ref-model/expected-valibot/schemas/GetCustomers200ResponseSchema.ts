/**
 * Valibot validation schema for GetCustomers200Response
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { CustomerSchema } from './CustomerSchema';

/**
 * Schema for GetCustomers200Response
 */
export const GetCustomers200ResponseSchema = v.array(CustomerSchema);