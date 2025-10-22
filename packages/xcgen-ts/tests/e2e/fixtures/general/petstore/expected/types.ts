/**
 * TypeScript type definitions
 * Generated from: Petstore API 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

export interface Pet {
  id: number;
  name: string;
  tag?: string | undefined;
}

export interface NewPet {
  name: string;
  tag?: string | undefined;
}

export interface Error {
  code: number;
  message: string;
}

export type GetPets200Response = Array<Pet>;

/**
 * Parameters for GET /pets
limit: How many items to return at one time
 */
export interface GetPetsParams {
  query: {
    /** How many items to return at one time */ limit?: number | undefined;
  };
}

/**
 * Parameters for GET /pets/{petId}
petId: The id of the pet to retrieve
 */
export interface GetPetsPetIdParams {
  path: {
    /** The id of the pet to retrieve */ petId: string;
  };
}
