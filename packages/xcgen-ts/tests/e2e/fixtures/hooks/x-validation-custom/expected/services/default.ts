/**
 * default service functions
 * Auto-generated from OpenAPI specification
 */

import { request } from "../client";
import type { XcgenApiError as _XcgenApiError } from "../client";
import type { Product } from "../models/index";
export type { Product } from "../models/index";

/**
 * Create a new product
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns Product
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function createProduct(
  options: Product,
  init?: RequestInit,
): Promise<Product> {
  return request({
    method: "POST",
    path: "/products",
    options,
    init,
  });
}
