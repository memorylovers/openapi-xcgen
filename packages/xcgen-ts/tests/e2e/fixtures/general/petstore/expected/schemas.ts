/**
 * Valibot validation schemas
 * Generated from: Petstore API 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";

/**
 * Schema for Pet
 */
export const PetSchema = v.object({
  id: v.number(),
  name: v.string(),
  tag: v.optional(v.string()),
});

/**
 * Schema for NewPet
 */
export const NewPetSchema = v.object({
  name: v.string(),
  tag: v.optional(v.string()),
});

/**
 * Schema for Error
 */
export const ErrorSchema = v.object({
  code: v.number(),
  message: v.string(),
});

/**
 * Schema for GetPets200Response
 */
export const GetPets200ResponseSchema = v.array(PetSchema);
