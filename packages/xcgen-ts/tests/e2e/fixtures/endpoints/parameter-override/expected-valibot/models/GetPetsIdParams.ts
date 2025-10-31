/**
 * GetPetsIdParams model
 * Auto-generated from OpenAPI specification
 */

/**
 * Parameters for GET /pets/{id}
id: Pet ID (Operation level - integer, overrides PathItem)
 */
export interface GetPetsIdParams {
  path: {
    /** Pet ID (Operation level - integer, overrides PathItem) */ id: number;
  };
}