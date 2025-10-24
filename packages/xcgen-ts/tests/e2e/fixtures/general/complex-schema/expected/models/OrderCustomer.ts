/**
 * OrderCustomer model
 * Auto-generated from OpenAPI specification
 */

import type { OrderCustomerAddress } from './OrderCustomerAddress';

export interface OrderCustomer {
  id: string;
  name: string;
  email?: string | undefined;
  address?: OrderCustomerAddress | undefined;
}