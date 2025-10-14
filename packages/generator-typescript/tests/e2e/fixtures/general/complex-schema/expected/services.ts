/**
 * API service functions
 * Generated from: Complex Schema API 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import { request } from "./client.js";
import type { XcgenApiError } from "./client.js";
import type { Order } from "./types.js";

/**
 * Create a new order
 * @param options - Request parameters
 * @param init - Additional fetch options
 * @returns Order
 * @throws {XcgenApiError} API error with status and response details
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
