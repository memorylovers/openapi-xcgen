/**
 * TypeScript type definitions
 * Generated from: Nullable Model Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import type { ProfileSettings } from './ProfileSettings';
import type { ProfileTags } from './ProfileTags';

export interface Profile {
  id: string;
  name?: string | undefined;
  bio?: string | null | undefined;
  nickname?: string | null | undefined;
  lastLoginDate?: Date | null | undefined;
  settings?: ProfileSettings | null | undefined;
  tags?: ProfileTags | null | undefined;
}
