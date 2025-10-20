/**
 * API service functions
 * Generated from: Complex Schema API 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import { request } from "./client";
import type { XcgenApiError as _XcgenApiError } from "./client";
import type { Order } from "./types";
export type { Order } from "./types";

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
