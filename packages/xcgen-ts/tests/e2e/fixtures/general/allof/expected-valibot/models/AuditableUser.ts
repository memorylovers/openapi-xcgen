/**
 * AuditableUser model
 * Auto-generated from OpenAPI specification
 */

import type { AuditableUserAllOf2 } from './AuditableUserAllOf2';
import type { Base } from './Base';
import type { Timestamps } from './Timestamps';

/**
 * User with audit timestamps
 */
export type AuditableUser = Base & Timestamps & AuditableUserAllOf2;