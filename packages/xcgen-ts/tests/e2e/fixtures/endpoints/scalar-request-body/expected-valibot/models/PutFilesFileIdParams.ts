/**
 * PutFilesFileIdParams model
 * Auto-generated from OpenAPI specification
 */

/**
 * Parameters for PUT /files/{fileId}
 */
export interface PutFilesFileIdParams {
  path: {
    fileId: string;
  };
  header: {
    xAuthor?: string | undefined;
  };
  body: string;
}