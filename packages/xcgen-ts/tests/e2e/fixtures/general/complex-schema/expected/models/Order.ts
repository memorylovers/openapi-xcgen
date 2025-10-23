/**
 * Order model
 * Auto-generated from OpenAPI specification
 */

import type { OrderItems } from './OrderItems';
import type { OrderCustomer } from './OrderCustomer';
import type { OrderStatus } from './OrderStatus';
import type { OrderPriority } from './OrderPriority';
import type { OrderTags } from './OrderTags';
import type { OrderMetadata } from './OrderMetadata';

export interface Order {
  id: string;
  items: OrderItems;
  customer: OrderCustomer;
  status?: OrderStatus | undefined;
  priority?: OrderPriority | undefined;
  tags?: OrderTags | undefined;
  metadata?: OrderMetadata | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}
