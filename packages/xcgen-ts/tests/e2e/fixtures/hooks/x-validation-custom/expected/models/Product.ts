/**
 * Product model
 * Auto-generated from OpenAPI specification
 */

export interface Product {
  /** Product SKU with custom validation */ sku: string;
  /** Product name (no custom validation) */ name: string;
  /** Product price with custom validation */ price: number;
  /** Contact email with custom validation */ email?: string | undefined;
}