/**
 * TypeScript type definitions
 * Generated from: Ref Model Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import type { Customer } from './Customer';
import type { OrderItems } from './OrderItems';

export interface Order {
  customer?: Customer | undefined;
  items?: OrderItems | undefined;
}
