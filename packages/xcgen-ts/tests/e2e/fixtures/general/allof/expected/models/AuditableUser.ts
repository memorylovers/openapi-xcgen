/**
 * AuditableUser model
 * Auto-generated from OpenAPI specification
 */

import type { Base } from './Base';
import type { Timestamps } from './Timestamps';
import type { AuditableUserAllOf2 } from './AuditableUserAllOf2';

/**
 * User with audit timestamps
 */
export type AuditableUser = Base & Timestamps & AuditableUserAllOf2;
