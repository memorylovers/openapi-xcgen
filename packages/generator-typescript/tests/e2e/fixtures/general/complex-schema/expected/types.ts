/**
 * TypeScript type definitions
 * Generated from: Complex Schema API 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

export interface Order {
  id: string;
  items: OrderItems;
  customer: OrderCustomer;
  status?: OrderStatus | undefined;
  priority?: OrderPriority | undefined;
  tags?: OrderTags | undefined;
  metadata?: OrderMetadata | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export type OrderItems = Array<OrderItemsItem>;

export interface OrderItemsItem {
  productId: string;
  quantity: number;
  price?: number | undefined;
  discount?: number | undefined;
}

export interface OrderCustomer {
  id: string;
  name: string;
  email?: string | undefined;
  address?: OrderCustomerAddress | undefined;
}

export interface OrderCustomerAddress {
  street?: string | undefined;
  city?: string | undefined;
  country?: string | undefined;
  zipCode?: string | undefined;
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export type OrderPriority = "low" | "normal" | "high" | "urgent";

export type OrderTags = Array<string>;

export type OrderMetadata = Record<string, string>;
