/**
 * TypeScript type definitions
 * Generated from: OpenAPI 3.0.3 discriminator any of example 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

export type Foo = Bar | Baz;

export type Baz = Qux;

export type Bar = Qux;

export type Spæcial = Qux;

export interface Qux {
  id: string;
  type: Quux;
}

export type Quux = "Bar" | "Baz";

export type Quuz = Bar | Baz | SpC3A6Cial;
