/**
 * Order model
 * Auto-generated from OpenAPI specification
 */

import type { Customer } from './Customer';
import type { OrderItems } from './OrderItems';

export interface Order {
  customer?: Customer | undefined;
  items?: OrderItems | undefined;
}