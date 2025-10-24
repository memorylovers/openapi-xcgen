/**
 * Product model
 * Auto-generated from OpenAPI specification
 */

import type { ProductTags } from './ProductTags';

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