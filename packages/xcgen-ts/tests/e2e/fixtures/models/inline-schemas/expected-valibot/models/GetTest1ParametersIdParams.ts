/**
 * GetTest1ParametersIdParams model
 * Auto-generated from OpenAPI specification
 */

/**
 * Parameters for GET /test-1-parameters/{id}
id: Path parameter - always required
category: Optional enum query parameter
status: Required enum query parameter
limit: Optional integer parameter with default value
includeDetails: Optional boolean parameter with default value
Authorization: Optional header parameter
sessionId: Optional cookie parameter
 */
export interface GetTest1ParametersIdParams {
  path: {
    /** Path parameter - always required */ id: string;
  };
  query: {
    /** Optional enum query parameter */ category?: string | undefined;
    /** Required enum query parameter */ status: string;
    /** Optional integer parameter with default value */ limit?: number | undefined;
    /** Optional boolean parameter with default value */ includeDetails?: boolean | undefined;
  };
  header: {
    /** Optional header parameter */ authorization?: string | undefined;
  };
  cookie: {
    /** Optional cookie parameter */ sessionId?: string | undefined;
  };
}