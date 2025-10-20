/**
 * TypeScript type definitions
 * Generated from: Ref Model Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

export interface Order {
  customer?: Customer | undefined;
  items?: OrderItems | undefined;
}

export type OrderItems = Array<OrderItem>;

export interface Customer {
  name?: string | undefined;
}

export interface OrderItem {
  productId?: string | undefined;
}

export type GetCustomers200Response = Array<Customer>;
