/**
 * GetPetsPetIdParams model
 * Auto-generated from OpenAPI specification
 */

/**
 * Parameters for GET /pets/{petId}
petId: The id of the pet to retrieve
 */
export interface GetPetsPetIdParams {
  path: {
    /** The id of the pet to retrieve */ petId: string;
  };
}