/**
 * Valibot validation schemas
 * Generated from: OpenAPI 3.1.0 discriminator one of example 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";

/**
 * Schema for Quux
 */
export const QuuxSchema = v.picklist(["Bar", "Baz"]);

/**
 * Schema for Qux
 */
export const QuxSchema = v.object({
  id: v.string(),
  type: QuuxSchema,
});

/**
 * Schema for Bar
 */
export const BarSchema = QuxSchema;

/**
 * Schema for Baz
 */
export const BazSchema = QuxSchema;

/**
 * Schema for Foo
 */
export const FooSchema = v.variant("type", [
  BarSchema,
  BazSchema,
]);

/**
 * Schema for Spæcial
 */
export const SpæcialSchema = QuxSchema;

/**
 * Schema for Quuz
 */
export const QuuzSchema = v.variant("type", [
  BarSchema,
  BazSchema,
  SpC3A6CialSchema,
]);
