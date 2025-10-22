/**
 * TypeScript type definitions
 * Generated from: Data Types Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

export interface DataTypes {
  id?: number | undefined;
  name?: string | undefined;
  score?: number | undefined;
  isActive?: boolean | undefined;
  birthDate?: Date | undefined;
  createdAt?: Date | undefined;
  profile?: DataTypesProfile | undefined;
  tags?: DataTypesTags | undefined;
  numbers?: DataTypesNumbers | undefined;
  scores?: DataTypesScores | undefined;
  flags?: DataTypesFlags | undefined;
}

export interface DataTypesProfile {
  bio?: string | undefined;
}

export type DataTypesTags = Array<string>;

export type DataTypesNumbers = Array<number>;

export type DataTypesScores = Array<number>;

export type DataTypesFlags = Array<boolean>;
