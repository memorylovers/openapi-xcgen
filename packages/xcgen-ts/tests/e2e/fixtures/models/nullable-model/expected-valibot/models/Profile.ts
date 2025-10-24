/**
 * Profile model
 * Auto-generated from OpenAPI specification
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