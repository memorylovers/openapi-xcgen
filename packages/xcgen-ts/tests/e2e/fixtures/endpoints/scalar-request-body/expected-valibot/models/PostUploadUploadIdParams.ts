/**
 * PostUploadUploadIdParams model
 * Auto-generated from OpenAPI specification
 */

/**
 * Parameters for POST /upload/{uploadId}
 */
export interface PostUploadUploadIdParams {
  path: {
    uploadId: string;
  };
  query: {
    filename: string;
    compress?: boolean | undefined;
  };
  body: Blob;
}