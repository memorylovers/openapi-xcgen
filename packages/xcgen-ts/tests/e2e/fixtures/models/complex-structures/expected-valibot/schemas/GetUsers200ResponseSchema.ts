/**
 * Valibot validation schema for GetUsers200Response
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { UserSchema } from './UserSchema';

/**
 * Schema for GetUsers200Response
 */
export const GetUsers200ResponseSchema = v.array(UserSchema);