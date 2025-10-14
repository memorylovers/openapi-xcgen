/**
 * API service functions
 * Generated from: Petstore API 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import { request } from "./client.js";
import type { XcgenApiError } from "./client.js";
import type { GetPetsParams, GetPets200Response, Error, NewPet, Pet, GetPetsPetIdParams } from "./types.js";

/**
 * List all pets
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns GetPets200Response
 * @throws {XcgenApiError} API error with status and response details
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
 * @throws {XcgenApiError} API error with status and response details
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
 * @throws {XcgenApiError} API error with status and response details
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
