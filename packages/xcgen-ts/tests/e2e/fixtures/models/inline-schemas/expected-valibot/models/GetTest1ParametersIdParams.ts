/**
 * GetTest1ParametersIdParams model
 * Auto-generated from OpenAPI specification
 */

import type { GetTest1ParametersIdParamsCategory } from './GetTest1ParametersIdParamsCategory';
import type { GetTest1ParametersIdParamsStatus } from './GetTest1ParametersIdParamsStatus';

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
    /** Optional enum query parameter */ category?: GetTest1ParametersIdParamsCategory | undefined;
    /** Required enum query parameter */ status: GetTest1ParametersIdParamsStatus;
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