/**
 * orders service functions
 * Auto-generated from OpenAPI specification
 */

import { request } from "../client";
import type { XcgenApiError as _XcgenApiError } from "../client";
import type { Order } from "../models/index";
export type { Order } from "../models/index";

/**
 * Create a new order
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns Order
 * @throws {_XcgenApiError} API error with status and response details
 */
export async function createOrder(
  options: Order,
  init?: RequestInit,
): Promise<Order> {
  return request({
    method: "POST",
    path: "/orders",
    options,
    init,
  });
}
