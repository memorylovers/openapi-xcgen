/**
 * TypeScript type definitions
 * Generated from: Complex Structures Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

export interface Level1 {
  data?: Level1Data | undefined;
}

export interface Level1Data {
  value?: string | undefined;
}

export interface Level2 {
  outer?: Level2Outer | undefined;
}

export interface Level2Outer {
  inner?: Level2OuterInner | undefined;
}

export interface Level2OuterInner {
  value?: string | undefined;
}

export interface Level3 {
  level1?: Level3Level1 | undefined;
}

export interface Level3Level1 {
  level2?: Level3Level1Level2 | undefined;
}

export interface Level3Level1Level2 {
  level3?: Level3Level1Level2Level3 | undefined;
}

export interface Level3Level1Level2Level3 {
  value?: string | undefined;
}

export interface Team {
  members?: TeamMembers | undefined;
}

export type TeamMembers = Array<TeamMembersItem>;

export interface TeamMembersItem {
  name?: string | undefined;
}

export interface User {
  name?: string | undefined;
}

export type GetUsers200Response = Array<User>;
