/**
 * default service functions
 * Auto-generated from OpenAPI specification
 */

import { request } from "../client";
import type { XcgenApiError as _XcgenApiError } from "../client";
import type { PostData200Response, PutFilesFileIdParams, PostUploadUploadIdParams } from "../models/index";
export type { PostData200Response, PutFilesFileIdParams, PostUploadUploadIdParams } from "../models/index";

/**
 * Post a log message
 * Upload a plain text log message
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns void
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function postLog(
  options: string,
  init?: RequestInit,
): Promise<void> {
  return request({
    method: "POST",
    path: "/log",
    options: { body: options },
    init,
  });
}

/**
 * Upload a binary file
 * Upload file as binary data
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns void
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function uploadFile(
  options: Blob,
  init?: RequestInit,
): Promise<void> {
  return request({
    method: "POST",
    path: "/upload",
    options: { body: options },
    init,
  });
}

/**
 * Post numeric data
 * Post a single number
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns PostData200Response
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function postData(
  options: number,
  init?: RequestInit,
): Promise<PostData200Response> {
  return request({
    method: "POST",
    path: "/data",
    options: { body: options },
    init,
  });
}

/**
 * Update file content with metadata
 * Update file with path parameter and text content
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns void
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function updateFileContent(
  options: PutFilesFileIdParams,
  init?: RequestInit,
): Promise<void> {
  return request({
    method: "PUT",
    path: "/files/{fileId}",
    options,
    init,
  });
}

/**
 * Upload file with metadata
 * Upload binary file with query parameters
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns void
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function uploadWithMetadata(
  options: PostUploadUploadIdParams,
  init?: RequestInit,
): Promise<void> {
  return request({
    method: "POST",
    path: "/upload/{uploadId}",
    options,
    init,
  });
}
