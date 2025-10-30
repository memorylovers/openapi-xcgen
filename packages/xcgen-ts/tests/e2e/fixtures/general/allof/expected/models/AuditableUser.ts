/**
 * AuditableUser model
 * Auto-generated from OpenAPI specification
 */

import type { AuditableUserallOf2 } from './AuditableUserallOf2';
import type { Base } from './Base';
import type { Timestamps } from './Timestamps';

/**
 * User with audit timestamps
 */
export type AuditableUser = Base & Timestamps & AuditableUserallOf2;