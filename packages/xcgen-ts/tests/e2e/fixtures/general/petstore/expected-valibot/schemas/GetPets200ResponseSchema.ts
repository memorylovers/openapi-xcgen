/**
 * Valibot validation schema for GetPets200Response
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { PetSchema } from './PetSchema';

/**
 * Schema for GetPets200Response
 */
export const GetPets200ResponseSchema = v.array(PetSchema);