/**
 * Valibot validation schemas
 * Generated from: OpenAPI 3.1.0 discriminator all of example 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";

/**
 * Schema for Foo
 */
export const FooSchema = v.object({
  id: v.string(),
});

/**
 * Schema for BarAllOf1
 */
export const BarAllOf1Schema = v.object({
  bar: v.optional(v.string()),
});

/**
 * Schema for Bar
 */
export const BarSchema = v.intersect([FooSchema, BarAllOf1Schema]);

/**
 * Schema for BazAllOf1
 */
export const BazAllOf1Schema = v.object({
  baz: v.optional(v.string()),
});

/**
 * Schema for Baz
 */
export const BazSchema = v.intersect([FooSchema, BazAllOf1Schema]);

/**
 * Schema for QuxAllOf1
 */
export const QuxAllOf1Schema = v.object({
  qux: v.optional(v.boolean()),
});

/**
 * Schema for Qux
 */
export const QuxSchema = v.intersect([FooSchema, QuxAllOf1Schema]);

/**
 * Schema for FooMapped
 */
export const FooMappedSchema = v.object({
  id: v.string(),
});

/**
 * Schema for BarMappedAllOf1
 */
export const BarMappedAllOf1Schema = v.object({
  bar: v.optional(v.string()),
});

/**
 * Schema for BarMapped
 */
export const BarMappedSchema = v.intersect([FooMappedSchema, BarMappedAllOf1Schema]);

/**
 * Schema for BazMappedAllOf1
 */
export const BazMappedAllOf1Schema = v.object({
  baz: v.optional(v.string()),
});

/**
 * Schema for BazMapped
 */
export const BazMappedSchema = v.intersect([FooMappedSchema, BazMappedAllOf1Schema]);

/**
 * Schema for QuxMappedAllOf1
 */
export const QuxMappedAllOf1Schema = v.object({
  qux: v.optional(v.boolean()),
});

/**
 * Schema for QuxMapped
 */
export const QuxMappedSchema = v.intersect([FooMappedSchema, QuxMappedAllOf1Schema]);

/**
 * Schema for BarUnion
 */
export const BarUnionSchema = v.object({
  id: v.optional(v.string()),
  bar: v.optional(v.string()),
});

/**
 * Schema for BazUnion
 */
export const BazUnionSchema = v.object({
  id: v.optional(v.string()),
  baz: v.optional(v.string()),
});

/**
 * Schema for FooUnion
 */
export const FooUnionSchema = v.variant("id", [
  BarUnionSchema,
  BazUnionSchema,
]);

/**
 * Schema for QuxExtend
 */
export const QuxExtendSchema = FooUnionSchema;
