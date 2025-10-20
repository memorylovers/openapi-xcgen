/**
 * TypeScript type definitions
 * Generated from: Validation Model Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

export interface Product {
  name?: string | undefined;
  code?: string | undefined;
  userId?: string | undefined;
  email?: string | undefined;
  website?: string | undefined;
  ipAddress?: string | undefined;
  price?: number | undefined;
  quantity?: number | undefined;
  tags?: ProductTags | undefined;
}

export type ProductTags = Array<string>;
