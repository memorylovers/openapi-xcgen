/**
 * Order model
 * Auto-generated from OpenAPI specification
 */

import type { OrderCustomer } from './OrderCustomer';
import type { OrderItems } from './OrderItems';
import type { OrderMetadata } from './OrderMetadata';
import type { OrderPriority } from './OrderPriority';
import type { OrderStatus } from './OrderStatus';
import type { OrderTags } from './OrderTags';

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