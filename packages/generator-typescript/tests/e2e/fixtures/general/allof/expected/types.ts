/**
 * TypeScript type definitions
 * Generated from: allOf Composition Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

export interface Base {
  /** Unique identifier */ id: string;
  /** Creation timestamp */ createdAt?: Date | undefined;
}

export type User = Base & UserAllOf1;

export interface UserAllOf1 {
  /** User name */ name: string;
  /** Email address */ email: string;
}

export interface Timestamps {
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

/**
 * User with audit timestamps
 */
export type AuditableUser = Base & Timestamps & AuditableUserAllOf2;

export interface AuditableUserAllOf2 {
  role: AuditableUserAllOf2Role;
}

export type AuditableUserAllOf2Role = "admin" | "user" | "guest";
