/**
 * GetPetsParams model
 * Auto-generated from OpenAPI specification
 */

/**
 * Parameters for GET /pets
limit: How many items to return at one time
 */
export interface GetPetsParams {
  query: {
    /** How many items to return at one time */ limit?: number | undefined;
  };
}