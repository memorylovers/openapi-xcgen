/**
 * TypeScript type definitions
 * Generated from: OpenAPI 3.1.0 discriminator all of example 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

export interface Foo {
  id: string;
}

export type Bar = Foo & BarAllOf1;

export interface BarAllOf1 {
  bar?: string | undefined;
}

export type Baz = Foo & BazAllOf1;

export interface BazAllOf1 {
  baz?: string | undefined;
}

export type Qux = Foo & QuxAllOf1;

export interface QuxAllOf1 {
  qux?: boolean | undefined;
}

export interface FooMapped {
  id: string;
}

export type BarMapped = FooMapped & BarMappedAllOf1;

export interface BarMappedAllOf1 {
  bar?: string | undefined;
}

export type BazMapped = FooMapped & BazMappedAllOf1;

export interface BazMappedAllOf1 {
  baz?: string | undefined;
}

export type QuxMapped = FooMapped & QuxMappedAllOf1;

export interface QuxMappedAllOf1 {
  qux?: boolean | undefined;
}

export type FooUnion = BarUnion | BazUnion;

export interface BarUnion {
  id?: string | undefined;
  bar?: string | undefined;
}

export interface BazUnion {
  id?: string | undefined;
  baz?: string | undefined;
}

export type QuxExtend = FooUnion;
