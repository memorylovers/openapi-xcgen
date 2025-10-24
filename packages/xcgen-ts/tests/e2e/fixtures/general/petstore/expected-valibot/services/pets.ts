/**
 * pets service functions
 * Auto-generated from OpenAPI specification
 */

import { request } from "../client";
import type { XcgenApiError as _XcgenApiError } from "../client";
import type { GetPetsParams, GetPets200Response, NewPet, Pet, GetPetsPetIdParams } from "../models/index";
export type { GetPetsParams, GetPets200Response, NewPet, Pet, GetPetsPetIdParams } from "../models/index";

/**
 * List all pets
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns GetPets200Response
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function listPets(
  options: GetPetsParams,
  init?: RequestInit,
): Promise<GetPets200Response> {
  return request({
    method: "GET",
    path: "/pets",
    options,
    init,
  });
}

/**
 * Create a pet
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns Pet
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function createPet(
  options: NewPet,
  init?: RequestInit,
): Promise<Pet> {
  return request({
    method: "POST",
    path: "/pets",
    options,
    init,
  });
}

/**
 * Info for a specific pet
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns Pet
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function getPetById(
  options: GetPetsPetIdParams,
  init?: RequestInit,
): Promise<Pet> {
  return request({
    method: "GET",
    path: "/pets/{petId}",
    options,
    init,
  });
}
