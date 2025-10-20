/**
 * TypeScript type definitions
 * Generated from: Inline Schemas Test API 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

export type RoleEnum = "admin" | "user";

export type StatusEnum = "active" | "inactive";

export interface UserResponse {
  id?: string | undefined;
  name?: string | undefined;
  profile?: UserProfile | undefined;
}

export interface UserProfile {
  bio?: string | undefined;
  active?: boolean | undefined;
}

export interface GetTest1ParametersId200Response {
  result?: string | undefined;
}

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

export interface PostTest2RequestRequestBody {
  name: string;
  email: string;
  nested?: PostTest2RequestRequestBodyNested | undefined;
}

export interface PostTest2RequestRequestBodyNested {
  value?: string | undefined;
  count?: number | undefined;
  role?: RoleEnum | undefined;
}

export interface PostTest2Request201Response {
  result?: string | undefined;
}

export type GetTest3Response201Response = Array<GetTest3Response201ResponseItem>;

export interface GetTest3Response201ResponseItem {
  name?: string | undefined;
  testStatus?: StatusEnum | undefined;
  isActive?: boolean | undefined;
}

export interface GetTest3Response202Response {
  count?: number | undefined;
  result?: GetTest3Response202ResponseResult | undefined;
}

export interface GetTest3Response202ResponseResult {
  status?: GetTest3Response202ResponseResultStatus | undefined;
}

export type GetTest3Response202ResponseResultStatus = "success" | "failed";

/**
 * Parameters for GET /test-3-response
 */
export interface GetTest3ResponseParams {
  query: {
    page?: number | undefined;
    limit?: number | undefined;
  };
}
