/**
 * TypeScript type definitions
 * Generated from: Nullable Model Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

export interface Profile {
  id: string;
  name?: string | undefined;
  bio?: string | null | undefined;
  nickname?: string | null | undefined;
  lastLoginDate?: string | null | undefined;
  settings?: ProfileSettings | null | undefined;
  tags?: ProfileTags | null | undefined;
}

export interface ProfileSettings {
  theme?: string | undefined;
}

export type ProfileTags = Array<string>;
